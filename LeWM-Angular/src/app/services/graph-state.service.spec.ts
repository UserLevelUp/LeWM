import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { GraphStateService } from './graph-state.service';
import { ConnectionStateService } from './connection-state.service';
import { GraphEdge } from '../models/graph-edge.model';

describe('GraphStateService', () => {
  let service: GraphStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ConnectionStateService]
    });
    service = TestBed.inject(GraphStateService);
  });

  afterEach(() => {
    // Service State Cleanup
    // Reset GraphStateService to default state
    service.resetToDefaults();
    
    // Clear localStorage test data
    localStorage.removeItem('lewm-graph-nodes');
    localStorage.removeItem('lewm-enhanced-pin-properties');
    
    // Reset any global state
    delete (window as any).testGlobals;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a unique id when adding an edge with duplicate id', () => {
    const initialCount: number = service.getEdges().length;
    const newEdge: GraphEdge = { id: 'conn_1', from: 'power.+9V', to: 'mic1.OUT' };
    service.addEdge(newEdge);
    const edges: GraphEdge[] = service.getEdges();
    expect(edges.length).toBe(initialCount + 1);
    const added: GraphEdge | undefined = edges.find((e: GraphEdge) => e.from === newEdge.from && e.to === newEdge.to);
    expect(added).toBeDefined();
    expect(added!.id).not.toBe('conn_1');
    // All IDs should be unique
    const ids: string[] = edges.map((e: GraphEdge) => e.id!);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should generate unique ids when adding multiple edges without ids', () => {
    const initialCount: number = service.getEdges().length;
    const countToAdd = 3;
    for (let i = 0; i < countToAdd; i++) {
      const edge: GraphEdge = { from: `nodeA.pin${i}`, to: `nodeB.pin${i}` };
      service.addEdge(edge);
    }
    const edges: GraphEdge[] = service.getEdges();
    expect(edges.length).toBe(initialCount + countToAdd);
    const newEdges: GraphEdge[] = edges.slice(-countToAdd);
    const ids: string[] = newEdges.map((e: GraphEdge) => e.id!);
    const unique = new Set(ids);
    expect(unique.size).toBe(countToAdd);
  });

  it('should regenerate a unique id when updating an edge to a duplicate id', () => {
    // Add two distinct edges
    service.addEdge({ id: 'e1', from: 'n1.p1', to: 'n2.p2' } as GraphEdge);
    service.addEdge({ id: 'e2', from: 'n3.p3', to: 'n4.p4' } as GraphEdge);
    // Attempt to update e1's id to 'e2'
    service.updateEdge('e1', { id: 'e2', from: 'n1.p1', to: 'n2.p2' } as GraphEdge);
    const after: GraphEdge[] = service.getEdges();
    // e1 should now have a new unique id not 'e2' and not collide
    const updated: GraphEdge | undefined = after.find((e: GraphEdge) => e.from === 'n1.p1' && e.to === 'n2.p2');
    expect(updated).toBeDefined();
    expect(updated!.id).not.toBe('e2');
    expect(updated!.id).not.toBe('e1');
    // All IDs in graph should be unique
    const allIds: string[] = after.map((e: GraphEdge) => e.id!);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  // Tests for the enhanced storage functionality
  describe('Priority Storage System', () => {
    beforeEach(() => {
      // Clear all storage before each test
      localStorage.clear();
      sessionStorage.clear();
    });

    it('should save normal mode state and restore it properly', () => {
      // Add a node to the graph
      const testNode = { id: 'test-node', type: 'test', x: 200, y: 300, width: 50, height: 50, label: 'Test Node', pins: [] };
      service.addNode(testNode);

      // Save the current state as normal mode state
      service.saveNormalModeState();

      // Verify the backup was saved
      const backupData = sessionStorage.getItem('lewm-normal-mode-backup');
      expect(backupData).toBeTruthy();
      
      const parsedBackup = JSON.parse(backupData!);
      expect(parsedBackup.nodes).toContain(jasmine.objectContaining({id: 'test-node'}));

      // Clear the graph to simulate switching to feature flag mode
      service.clearNodes();
      expect(service.getNodes().length).toBe(0);

      // Restore the normal mode state
      const restored = service.restoreNormalModeState();
      expect(restored).toBe(true);
      
      // Verify the node was restored
      const restoredNodes = service.getNodes();
      expect(restoredNodes).toContain(jasmine.objectContaining({id: 'test-node'}));
    });

    it('should auto-save to localStorage and sessionStorage when nodes are modified', () => {
      // Add a node which should trigger auto-save
      const testNode = { id: 'auto-save-test', type: 'test', x: 100, y: 200, width: 40, height: 40, label: 'Auto Save Test', pins: [] };
      service.addNode(testNode);

      // Verify data was saved to both storage types
      const localGraphData = localStorage.getItem('lewm-local-graph');
      const sessionGraphData = sessionStorage.getItem('lewm-local-graph-session');
      
      expect(localGraphData).toBeTruthy();
      expect(sessionGraphData).toBeTruthy();

      const localParsed = JSON.parse(localGraphData!);
      const sessionParsed = JSON.parse(sessionGraphData!);
      
      expect(localParsed.nodes).toContain(jasmine.objectContaining({id: 'auto-save-test'}));
      expect(sessionParsed.nodes).toContain(jasmine.objectContaining({id: 'auto-save-test'}));
    });

    it('should auto-save when node positions are updated', () => {
      // Add a node first
      const testNode = { id: 'position-test', type: 'test', x: 100, y: 100, width: 40, height: 40, label: 'Position Test', pins: [] };
      service.addNode(testNode);

      // Clear storage to test the position update save
      localStorage.removeItem('lewm-local-graph');
      sessionStorage.removeItem('lewm-local-graph-session');

      // Update node position which should trigger auto-save
      const updates = new Map();
      updates.set('position-test', { x: 300, y: 400 });
      service.updateNodePositions(updates);

      // Verify data was saved
      const localGraphData = localStorage.getItem('lewm-local-graph');
      const sessionGraphData = sessionStorage.getItem('lewm-local-graph-session');
      
      expect(localGraphData).toBeTruthy();
      expect(sessionGraphData).toBeTruthy();

      const localParsed = JSON.parse(localGraphData!);
      expect(localParsed.nodes).toContain(jasmine.objectContaining({
        id: 'position-test',
        x: 300,
        y: 400
      }));
    });

    it('should auto-save when nodes are deleted', () => {
      // Add a node first
      const testNode = { id: 'delete-test', type: 'test', x: 100, y: 100, width: 40, height: 40, label: 'Delete Test', pins: [] };
      service.addNode(testNode);

      // Clear storage to test the delete save
      localStorage.removeItem('lewm-local-graph');
      sessionStorage.removeItem('lewm-local-graph-session');

      // Delete the node which should trigger auto-save
      service.deleteNodes(['delete-test']);

      // Verify data was saved (should not contain the deleted node)
      const localGraphData = localStorage.getItem('lewm-local-graph');
      expect(localGraphData).toBeTruthy();

      const localParsed = JSON.parse(localGraphData!);
      expect(localParsed.nodes.find((n: any) => n.id === 'delete-test')).toBeUndefined();
    });
  });

  describe('Mode Switching State Management', () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    it('should not lose user changes when switching from normal mode to feature flag mode and back', () => {
      // Create a test scenario simulating user changes in normal mode
      const userNode = { id: 'user-change', type: 'user', x: 150, y: 250, width: 60, height: 50, label: 'User Added Node', pins: [] };
      service.addNode(userNode);

      // Simulate saving normal mode state (as done by FeatureFlagMode.activate())
      service.saveNormalModeState();

      // Clear the graph (as done by FeatureFlagMode.activate())
      service.clearNodes();
      expect(service.getNodes().length).toBe(0);

      // Add feature flag nodes (simulating feature flag mode)
      const featureNode = { id: 'feature-node', type: 'feature', x: 100, y: 100, width: 100, height: 80, label: 'Feature Node', pins: [] };
      service.addNode(featureNode);

      // Simulate returning to normal mode (as done by FeatureFlagMode.deactivate())
      const restored = service.restoreNormalModeState();
      expect(restored).toBe(true);

      // Verify the user's node is back and feature nodes are gone
      const finalNodes = service.getNodes();
      expect(finalNodes).toContain(jasmine.objectContaining({id: 'user-change'}));
      expect(finalNodes.find(n => n.id === 'feature-node')).toBeUndefined();
    });

    it('should handle the case where no normal mode backup exists', () => {
      // Try to restore without any backup
      const restored = service.restoreNormalModeState();
      expect(restored).toBe(false);

      // The service should handle this gracefully
      expect(service.getNodes).not.toThrow();
    });
  });
});
