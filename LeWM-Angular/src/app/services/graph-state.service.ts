import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GraphNode } from '../models/graph-node.model';
import { GraphEdge } from '../models/graph-edge.model';
import { ConnectionStateService } from './connection-state.service';
import { HttpClient } from '@angular/common/http';
import { Pin, DEFAULT_PIN_TEXT_STYLE, LegacyPin } from '../interfaces/pin.interface';

// GraphData interface matching the file save format with features support
interface GraphData {
  version: string;
  metadata: {
    created: string;
    modified: string;
    name: string;
    description?: string;
  };
  nodes: GraphNode[];
  pins?: Pin[];
  connections?: GraphEdge[];
  edges?: GraphEdge[]; // For backward compatibility
  features?: {
    'feature-nodes': GraphNode[];
    'featurePins': Pin[];
    'feature-connections': GraphEdge[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class GraphStateService {
  // Storage keys
  private readonly NODES_LOCAL_KEY = 'lewm-graph-nodes';
  private readonly NODES_SESSION_KEY = 'lewm-graph-nodes-session';
  private readonly LOCAL_GRAPH_KEY = 'lewm-local-graph';
  private readonly LOCAL_GRAPH_SESSION_KEY = 'lewm-local-graph-session';
  
  // Feature storage keys
  private readonly FEATURE_BACKUP_KEY = 'lewm-feature-mode-backup';
  
  private readonly http = inject(HttpClient);
  private initializationPromise: Promise<void>;
  // Default initial data
  private readonly defaultNodes: GraphNode[] = [
    { id: 'power', type: 'power', x: 100, y: 150, width: 80, height: 60, label: '9V Battery', pins: [{x: 80, y: 20, name: '+9V'}, {x: 80, y: 40, name: 'GND'}] },
    { id: 'reg', type: 'ic', x: 250, y: 150, width: 60, height: 40, label: 'LM7805', pins: [{x: 0, y: 20, name: 'IN'}, {x: 30, y: 40, name: 'GND'}, {x: 60, y: 20, name: 'OUT'}] },
    { id: 'mic1', type: 'component', x: 100, y: 250, width: 40, height: 40, label: 'MIC1', pins: [{x: 40, y: 20, name: 'OUT'}, {x: 20, y: 40, name: 'GND'}] },
    { id: 'r1', type: 'resistor', x: 180, y: 270, width: 60, height: 20, label: '10kΩ', pins: [{x: 0, y: 10, name: 'A'}, {x: 60, y: 10, name: 'B'}] },
    { id: 'amp1', type: 'ic', x: 300, y: 230, width: 80, height: 60, label: 'LM386', pins: [
      {x: 0, y: 15, name: 'GAIN'}, {x: 0, y: 30, name: '-IN'}, {x: 0, y: 45, name: '+IN'},
      {x: 20, y: 60, name: 'GND'}, {x: 40, y: 60, name: 'VCC'}, {x: 60, y: 60, name: 'BYP'},
      {x: 80, y: 45, name: 'OUT'}, {x: 80, y: 15, name: 'VS'}
    ]},
  ];
  
  // Use _nodes for internal node state management - load with priority loading
  private readonly _nodes = new BehaviorSubject<GraphNode[]>([]);

  // Expose nodes as observable for components to subscribe to
  readonly nodes$ = this._nodes.asObservable();
  private readonly connections = inject(ConnectionStateService);
  get edges$() {
    return this.connections.edges$;
  }

  constructor() {
    // Initialize with empty state and load asynchronously
    this.initializationPromise = this.initializeGraph();
  }

  /**
   * Wait for the service to be fully initialized
   */
  async waitForInitialization(): Promise<void> {
    return this.initializationPromise;
  }

  /**
   * Initialize graph with priority loading: sessionStorage -> localStorage -> default JSON file
   */
  private async initializeGraph(): Promise<void> {
    try {
      const graphData = await this.loadGraphWithPriority();
      this._nodes.next(graphData.nodes);
      this.connections.setEdges(graphData.edges);
      console.log('📊 Graph initialized with priority loading');
    } catch (error) {
      console.error('Failed to initialize graph:', error);
      // Fallback to hardcoded defaults
      this._nodes.next(this.defaultNodes);
      this.connections.resetToDefaults();
    }
  }

  /**
   * Load graph data with priority: sessionStorage -> localStorage -> default JSON file
   */
  private async loadGraphWithPriority(): Promise<{ nodes: GraphNode[], edges: GraphEdge[] }> {
    // Try sessionStorage first
    const sessionData = this.loadFromSessionStorage();
    if (sessionData) {
      console.log('📥 Loaded graph from sessionStorage');
      return sessionData;
    }

    // Try localStorage second
    const localData = this.loadFromLocalStorage();
    if (localData) {
      console.log('📥 Loaded graph from localStorage');
      return localData;
    }

    // Finally, try default JSON file
    try {
      const defaultData = await this.loadFromDefaultFile();
      console.log('📥 Loaded graph from default JSON file');
      return defaultData;
    } catch (error) {
      console.warn('Failed to load default JSON, using hardcoded defaults');
      return {
        nodes: this.defaultNodes,
        edges: []
      };
    }
  }

  /**
   * Load default graph from JSON file
   */
  private async loadFromDefaultFile(): Promise<{ nodes: GraphNode[], edges: GraphEdge[] }> {
    try {
      const defaultGraph = await this.http.get<GraphData>('/assets/default.graph.json').toPromise();
      if (!defaultGraph) {
        throw new Error('Default graph data is null');
      }
      return this.extractNodesAndEdges(defaultGraph);
    } catch (error) {
      console.warn('Failed to load default.graph.json, using hardcoded defaults:', error);
      return {
        nodes: this.defaultNodes,
        edges: []
      };
    }
  }

  // Method to get the current snapshot of nodes
  getNodes(): GraphNode[] {
    return this._nodes.getValue();
  }

  /**
   * Adds a new node to the graph.
   * @param node The GraphNode object to add.
   */
  addNode(node: GraphNode): void {
    const currentNodes = this._nodes.getValue();
    this._nodes.next([...currentNodes, node]);
    // Auto-save changes as local graph
    this.saveLocalGraph();
  }

  /**
   * Updates the position of multiple nodes.
   * @param updates A map of nodeId to new {x, y} coordinates.
   */
  updateNodePositions(updates: Map<string, { x: number; y: number }>): void {
    const currentNodes = this._nodes.getValue();
    const updatedNodes = currentNodes.map(node => {
      const update = updates.get(node.id);
      return update ? { ...node, x: update.x, y: update.y } : node;
    });
    this._nodes.next(updatedNodes);
    // Auto-save changes as local graph
    this.saveLocalGraph();
  }

  /**
   * Updates an entire node (including pins).
   * @param nodeId The ID of the node to update.
   * @param updatedNode The updated node data.
   */
  updateNode(nodeId: string, updatedNode: GraphNode): void {
    const currentNodes = this._nodes.getValue();
    const nodeIndex = currentNodes.findIndex(n => n.id === nodeId);
    
    if (nodeIndex === -1) {
      console.warn(`Node with id ${nodeId} not found`);
      return;
    }
    
    console.log(`📝 Updating node ${nodeId} in GraphStateService`);
    console.log(`📌 Node pins before update:`, currentNodes[nodeIndex].pins);
    console.log(`📌 Node pins after update:`, updatedNode.pins);
    
    const updatedNodes = [...currentNodes];
    updatedNodes[nodeIndex] = { ...updatedNode };
    this._nodes.next(updatedNodes);
    
    // Store to localStorage for persistence
    this.saveToLocalStorage();
    
    console.log(`💾 Node ${nodeId} updated and saved to localStorage`);
  }

  /**
   * Updates an entire node synchronously and returns a promise when persistence is complete.
   * @param nodeId The ID of the node to update.
   * @param updatedNode The updated node data.
   * @returns Promise that resolves when the update is persisted.
   */
  updateNodeSync(nodeId: string, updatedNode: GraphNode): Promise<void> {
    return new Promise((resolve) => {
      this.updateNode(nodeId, updatedNode);
      // Add a small delay to ensure state is updated
      setTimeout(() => resolve(), 10);
    });
  }

  deleteNodes(ids: string[]): void {
    const currentNodes = this._nodes.getValue();
    this._nodes.next(currentNodes.filter(node => !ids.includes(node.id)));
    
    // Also remove edges connected to deleted nodes
    const currentEdges = this.connections.getEdges();
    const filteredEdges = currentEdges.filter(edge => {
      const [fromNodeId] = edge.from.split('.');
      const [toNodeId] = edge.to.split('.');
      return !ids.includes(fromNodeId) && !ids.includes(toNodeId);
    });

    const removedConnections = currentEdges.length - filteredEdges.length;
    if (removedConnections > 0) {
      console.log(`Removed ${removedConnections} connections due to node deletion`);
    }

    // Auto-save changes as local graph
    this.saveLocalGraph();
    this.connections.setEdges(filteredEdges);
  }

  // Method to get the current snapshot of edges
  getEdges(): GraphEdge[] {
    return this.connections.getEdges();
  }

  /**
   * Adds a new edge to the graph.
   * @param edge The GraphEdge object to add.
   */
  addEdge(edge: GraphEdge): void {
    this.connections.addEdge(edge);
  }

  /**
   * Removes an edge from the graph.
   * @param edgeId The ID of the edge to remove.
   */
  removeEdge(edgeId: string): void {
    this.connections.removeEdge(edgeId);
  }

  /**
   * Updates an existing edge in the graph.
   * @param edgeId The ID of the edge to update.
   * @param updatedEdge The updated edge data.
   */
  updateEdge(edgeId: string, updatedEdge: GraphEdge): void {
    this.connections.updateEdge(edgeId, updatedEdge);
  }

  /**
   * Notifies subscribers of edge state changes (for selection, hover, etc.)
   */
  notifyEdgeStateChange(): void {
    this.connections.notifyEdgeStateChange();
  }

  /**
   * Gets the absolute position of a pin on a node.
   * @param nodeId The ID of the node.
   * @param pinName The name of the pin.
   * @returns The absolute {x, y} coordinates of the pin, or null if not found.
   */
  getPinPosition(nodeId: string, pinName: string): { x: number; y: number } | null {
    const node = this.getNodes().find(n => n.id === nodeId);
    if (!node || !node.pins) return null;
    
    const pin = node.pins.find(p => p.name === pinName);
    if (!pin) return null;
    
    return {
      x: node.x + pin.x,
      y: node.y + pin.y
    };
  }

  /**
   * Checks if a pin exists on a node.
   * @param nodeId The ID of the node.
   * @param pinName The name of the pin.
   * @returns True if the pin exists, false otherwise.
   */
  pinExists(nodeId: string, pinName: string): boolean {
    const node = this.getNodes().find(n => n.id === nodeId);
    if (!node || !node.pins) return false;
    
    return node.pins.some(p => p.name === pinName);
  }

  /**
   * Removes specified pins from a node and cleans up associated connections.
   * @param nodeId The ID of the node from which to remove pins.
   * @param pinNames List of pin names to remove.
   */
  removePins(nodeId: string, pinNames: string[]): void {
    const nodes = this._nodes.getValue();
    const idx = nodes.findIndex(n => n.id === nodeId);
    if (idx === -1) return;
    const node = {...nodes[idx]};
    if (!node.pins) return;
    node.pins = node.pins.filter(pin => !pinNames.includes(pin.name));
    const updated = [...nodes]; updated[idx] = node;
    this._nodes.next(updated);
    // clean up connections for each removed pin
    pinNames.forEach(name => this.removeConnectionsForPin(nodeId, name));
  }

  /**
   * Removes orphaned connections that reference a specific pin.
   * @param nodeId The ID of the node.
   * @param pinName The name of the pin that was removed.
   * @returns The number of connections removed.
   */
  removeConnectionsForPin(nodeId: string, pinName: string): number {
    const currentEdges = this.connections.getEdges();
    const pinReference = `${nodeId}.${pinName}`;
    
    const validEdges = currentEdges.filter(edge => 
      edge.from !== pinReference && edge.to !== pinReference
    );
    
    const removedCount = currentEdges.length - validEdges.length;
    
    if (removedCount > 0) {
      this.connections.setEdges(validEdges);
      console.log(`Removed ${removedCount} connections for pin ${nodeId}.${pinName}`);
    }
    
    return removedCount;
  }

  /**
   * Removes all orphaned connections (connections that reference non-existent pins).
   * @returns The number of orphaned connections removed.
   */
  cleanupOrphanedConnections(): number {
    const currentEdges = this.connections.getEdges();
    const validEdges = currentEdges.filter(edge => this.isConnectionValid(edge));
    
    const removedCount = currentEdges.length - validEdges.length;
    
    if (removedCount > 0) {
      this.connections.setEdges(validEdges);
      console.log(`Cleaned up ${removedCount} orphaned connections`);
    }
    
    return removedCount;
  }

  /**
   * Checks if a connection is valid (both endpoints exist).
   * @param edge The edge to validate.
   * @returns True if the connection is valid, false otherwise.
   */
  private isConnectionValid(edge: GraphEdge): boolean {
    try {
      const [fromNodeId, fromPinName] = edge.from.split('.');
      const [toNodeId, toPinName] = edge.to.split('.');
      
      // Check if both pins exist
      return this.pinExists(fromNodeId, fromPinName) && this.pinExists(toNodeId, toPinName);
    } catch {
      // Invalid connection format
      return false;
    }
  }

  /**
   * Validates the integrity of all connections and removes any orphaned ones.
   * This method can be called periodically or after major operations to ensure data consistency.
   * @returns A summary of the validation results.
   */
  validateConnectionIntegrity(): { totalConnections: number; validConnections: number; removedConnections: number } {
    const currentEdges = this.connections.getEdges();
    const totalConnections = currentEdges.length;
    
    const validEdges = currentEdges.filter(edge => this.isConnectionValid(edge));
    const validConnections = validEdges.length;
    const removedConnections = totalConnections - validConnections;
    
    if (removedConnections > 0) {
      this.connections.setEdges(validEdges);
      console.log(`Connection integrity validation: removed ${removedConnections} orphaned connections out of ${totalConnections} total`);
    }
    
    return {
      totalConnections,
      validConnections,
      removedConnections
    };
  }
  
  /**
   * Extract pins from all nodes in the format used by file save
   */
  private getAllPinsFromNodes(): Pin[] {
    const nodes = this._nodes.getValue();
    const pins: Pin[] = [];

    nodes.forEach(node => {
      if (node.pins) {
        node.pins.forEach((pin: LegacyPin) => {
          pins.push({
            id: `${node.id}.${pin.name}`,
            nodeId: node.id,
            label: pin.name,
            position: {
              side: 'left',
              offset: 0.5,
              x: pin.x,
              y: pin.y
            },
            pinType: 'input',
            pinStyle: {
              size: 8,
              color: '#000000',
              shape: 'circle',
              borderWidth: 1,
              borderColor: '#000000'
            },
            textStyle: DEFAULT_PIN_TEXT_STYLE,
            isInput: true,
            isOutput: false,
            pinNumber: '',
            signalName: '',
            pinSize: 4,
            pinColor: '#000000',
            showPinNumber: false
          });
        });
      }
    });

    return pins;
  }

  /**
   * Save current graph state to both localStorage and sessionStorage as "local graph"
   * Uses the same format as file save for consistency, including features separation
   */
  private saveLocalGraph(): void {
    try {
      // Get feature data from storage if it exists
      const existingFeatureData = this.loadFeatureDataFromStorage();
      
      const graphData: GraphData = {
        version: '1.0',
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          name: 'Untitled Graph',
          description: ''
        },
        nodes: this._nodes.getValue().map(node => ({
          ...node,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          style: node.style || {}
        })),
        pins: this.getAllPinsFromNodes(),
        connections: this.connections.getEdges(),
        features: existingFeatureData || {
          'feature-nodes': [],
          'featurePins': [],
          'feature-connections': []
        }
      };
      
      // Save to both localStorage and sessionStorage
      localStorage.setItem(this.LOCAL_GRAPH_KEY, JSON.stringify(graphData));
      sessionStorage.setItem(this.LOCAL_GRAPH_SESSION_KEY, JSON.stringify(graphData));
      
      // Also update the standard keys for backward compatibility
      localStorage.setItem(this.NODES_LOCAL_KEY, JSON.stringify(graphData.nodes));
      sessionStorage.setItem(this.NODES_SESSION_KEY, JSON.stringify(graphData.nodes));
      
      console.log('💾 Saved local graph to localStorage and sessionStorage with features separation');
    } catch (error) {
      console.error('Failed to save local graph:', error);
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  private saveToLocalStorage(): void {
    this.saveLocalGraph();
  }
  
  /**
   * Extract nodes and edges from GraphData format, handling both new and old formats
   */
  private extractNodesAndEdges(graphData: GraphData | any): { nodes: GraphNode[], edges: GraphEdge[] } {
    // Handle new GraphData format
    if (graphData.version && graphData.metadata && graphData.nodes) {
      return {
        nodes: graphData.nodes,
        edges: graphData.connections || graphData.edges || []
      };
    }
    
    // Handle old format for backward compatibility
    if (graphData.nodes && graphData.edges) {
      return {
        nodes: graphData.nodes,
        edges: graphData.edges
      };
    }
    
    // Fallback
    return {
      nodes: graphData.nodes || [],
      edges: graphData.edges || graphData.connections || []
    };
  }

  /**
   * Load graph data from sessionStorage
   */
  private loadFromSessionStorage(): { nodes: GraphNode[], edges: GraphEdge[] } | null {
    try {
      // Try to load full graph first
      const fullGraphData = sessionStorage.getItem(this.LOCAL_GRAPH_SESSION_KEY);
      if (fullGraphData) {
        const graphData: GraphData = JSON.parse(fullGraphData);
        console.log('📥 Loaded full graph from sessionStorage');
        return this.extractNodesAndEdges(graphData);
      }

      // Fallback to nodes-only data
      const nodesData = sessionStorage.getItem(this.NODES_SESSION_KEY);
      if (nodesData) {
        const nodes = JSON.parse(nodesData);
        console.log('📥 Loaded nodes from sessionStorage');
        return { nodes, edges: [] };
      }
    } catch (error) {
      console.error('Failed to load from sessionStorage:', error);
    }
    return null;
  }

  /**
   * Load graph data from localStorage  
   */
  private loadFromLocalStorage(): { nodes: GraphNode[], edges: GraphEdge[] } | null {
    try {
      // Try to load full graph first
      const fullGraphData = localStorage.getItem(this.LOCAL_GRAPH_KEY);
      if (fullGraphData) {
        const graphData: GraphData = JSON.parse(fullGraphData);
        console.log('📥 Loaded full graph from localStorage');
        return this.extractNodesAndEdges(graphData);
      }

      // Fallback to nodes-only data for backward compatibility
      const nodesData = localStorage.getItem(this.NODES_LOCAL_KEY);
      if (nodesData) {
        const nodes = JSON.parse(nodesData);
        console.log('📥 Loaded nodes from localStorage');
        return { nodes, edges: [] };
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  }

  /**
   * Save the current normal mode graph state for restoration
   */
  saveNormalModeState(): void {
    try {
      const graphData: GraphData = {
        version: '1.0',
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          name: 'Normal Mode Backup',
          description: 'Temporary backup of normal mode state'
        },
        nodes: this._nodes.getValue().map(node => ({
          ...node,
          style: node.style || {}
        })),
        pins: this.getAllPinsFromNodes(),
        connections: this.connections.getEdges()
      };
      
      sessionStorage.setItem('lewm-normal-mode-backup', JSON.stringify(graphData));
      console.log('💾 Saved normal mode state for restoration');
    } catch (error) {
      console.error('Failed to save normal mode state:', error);
    }
  }

  /**
   * Restore the normal mode graph state
   */
  restoreNormalModeState(): boolean {
    try {
      const backupData = sessionStorage.getItem('lewm-normal-mode-backup');
      if (backupData) {
        const graphData: GraphData = JSON.parse(backupData);
        const extracted = this.extractNodesAndEdges(graphData);
        this._nodes.next(extracted.nodes);
        this.connections.setEdges(extracted.edges);
        console.log('📥 Restored normal mode state');
        return true;
      }
    } catch (error) {
      console.error('Failed to restore normal mode state:', error);
    }
    return false;
  }

  /**
   * Manually reload graph data using priority loading
   */
  async reloadGraphWithPriority(): Promise<void> {
    await this.initializeGraph();
  }
  
  /**
   * Clear all nodes and connections without loading defaults
   */
  clearNodes(): void {
    this._nodes.next([]);
    this.connections.setEdges([]);
    console.log('🧹 Cleared all nodes and connections');
  }

  /**
   * Clear saved data and reset to defaults
   */
  resetToDefaults(): void {
    // Clear all storage keys
    localStorage.removeItem(this.NODES_LOCAL_KEY);
    localStorage.removeItem(this.LOCAL_GRAPH_KEY);
    localStorage.removeItem('lewm-enhanced-pin-properties');
    localStorage.removeItem('lewm-normal-mode-backup');
    localStorage.removeItem(this.FEATURE_BACKUP_KEY);
    
    sessionStorage.removeItem(this.NODES_SESSION_KEY);
    sessionStorage.removeItem(this.LOCAL_GRAPH_SESSION_KEY);
    sessionStorage.removeItem('lewm-normal-mode-backup');
    sessionStorage.removeItem(this.FEATURE_BACKUP_KEY);
    
    this._nodes.next(this.defaultNodes);
    this.connections.resetToDefaults();
    console.log('🔄 Reset to default data');
  }

  /**
   * Load feature data from storage (for maintaining feature state)
   */
  private loadFeatureDataFromStorage(): { 'feature-nodes': GraphNode[], 'featurePins': Pin[], 'feature-connections': GraphEdge[] } | null {
    try {
      // Try sessionStorage first
      const sessionData = sessionStorage.getItem(this.LOCAL_GRAPH_SESSION_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        if (parsed.features) {
          return parsed.features;
        }
      }

      // Try localStorage second  
      const localData = localStorage.getItem(this.LOCAL_GRAPH_KEY);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.features) {
          return parsed.features;
        }
      }
    } catch (error) {
      console.warn('Failed to load feature data from storage:', error);
    }
    return null;
  }

  /**
   * Save feature mode state for restoration
   */
  saveFeatureModeState(): void {
    try {
      const featureData = {
        'feature-nodes': this._nodes.getValue().map(node => ({
          ...node,
          style: node.style || {}
        })),
        'featurePins': this.getAllPinsFromNodes(),
        'feature-connections': this.connections.getEdges()
      };
      
      // Save feature data to existing graph structure
      this.saveFeatureDataToStorage(featureData);
      console.log('💾 Saved feature mode state for restoration');
    } catch (error) {
      console.error('Failed to save feature mode state:', error);
    }
  }

  /**
   * Restore the feature mode graph state
   */
  restoreFeatureModeState(): boolean {
    try {
      const featureData = this.loadFeatureDataFromStorage();
      if (featureData && featureData['feature-nodes'].length > 0) {
        this._nodes.next(featureData['feature-nodes']);
        this.connections.setEdges(featureData['feature-connections'] || []);
        console.log('📥 Restored feature mode state');
        return true;
      }
    } catch (error) {
      console.error('Failed to restore feature mode state:', error);
    }
    return false;
  }

  /**
   * Save feature data to the graph storage structure
   */
  private saveFeatureDataToStorage(featureData: { 'feature-nodes': GraphNode[], 'featurePins': Pin[], 'feature-connections': GraphEdge[] }): void {
    try {
      // Update existing localStorage data
      const localData = localStorage.getItem(this.LOCAL_GRAPH_KEY);
      if (localData) {
        const graphData = JSON.parse(localData);
        graphData.features = featureData;
        localStorage.setItem(this.LOCAL_GRAPH_KEY, JSON.stringify(graphData));
      }

      // Update existing sessionStorage data
      const sessionData = sessionStorage.getItem(this.LOCAL_GRAPH_SESSION_KEY);
      if (sessionData) {
        const graphData = JSON.parse(sessionData);
        graphData.features = featureData;
        sessionStorage.setItem(this.LOCAL_GRAPH_SESSION_KEY, JSON.stringify(graphData));
      }
    } catch (error) {
      console.error('Failed to save feature data to storage:', error);
    }
  }
}
