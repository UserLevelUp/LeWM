import { GraphMode } from '../interfaces/graph-mode.interface';
import { GraphNode } from '../models/graph-node.model';
import { FeatureGraphService } from '../services/feature-graph.service';
import { GraphStateService } from '../services/graph-state.service';
import { FeatureGraph, FeatureGraphNode } from '../interfaces/feature-graph.interface';

export class FeatureFlagMode implements GraphMode {
  name = 'feature-flag';
  displayName = 'Feature Flags';
  isActive = false;
  selectedPins = new Set<string>();
  
  constructor(
    private featureGraphService: FeatureGraphService,
    private graphState: GraphStateService
  ) {}
  
  activate(): void {
    console.log('Feature Flag mode activated');
    this.selectedPins.clear();
    this.loadFeatureGraph();
  }
  
  deactivate(): void {
    console.log('Feature Flag mode deactivated');
    this.selectedPins.clear();
    // Reset to defaults when leaving feature flag mode
    this.graphState.resetToDefaults();
  }
  
  handleNodeClick(node: GraphNode, event: MouseEvent): boolean {
    // Handle feature node selection and toggling
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      return false; // Let component handle multi-selection
    }
    
    // Single selection and feature toggle
    const featureName = node.label;
    console.log(`Feature Flag mode: Toggling feature ${featureName}`);
    this.featureGraphService.toggleFeature(featureName);
    
    // Update the visual representation
    this.updateFeatureNodeVisual(node, featureName);
    return true;
  }
  
  handlePinClick(node: GraphNode, pin: { x: number; y: number; name: string }, event: MouseEvent): boolean {
    // Feature flag mode doesn't use pin clicks for connections
    // Instead, pins represent dependencies which are read-only
    console.log(`Feature Flag mode: Pin clicked on ${node.label}.${pin.name} (dependency visualization)`);
    return true;
  }
  
  handleCanvasClick(event: MouseEvent): boolean {
    // Clear selection on canvas click
    return false; // Let component handle selection clearing
  }
  
  handleMouseMove(event: MouseEvent): boolean {
    // Feature flag mode doesn't need special mouse move handling
    return false;
  }
  
  handleKeyDown(event: KeyboardEvent): boolean {
    // Handle feature flag specific shortcuts
    switch (event.key.toLowerCase()) {
      case 'r':
        // Reset all features to default
        event.preventDefault();
        this.resetToDefaults();
        return true;
      case 'e':
        // Enable all compatible features
        event.preventDefault();
        this.enableAllCompatible();
        return true;
      case 'enter':
        // If a feature is selected, toggle it
        event.preventDefault();
        this.toggleSelectedFeature();
        return true;
    }
    return false;
  }
  
  renderOverlay(canvas: SVGElement): void {
    // Add visual indicators for feature states
    this.renderFeatureStateOverlay(canvas);
  }
  
  getCursor(): string {
    return 'pointer'; // Features are clickable
  }
  
  deleteSelectedPins(): void {
    // Feature flag mode doesn't allow pin deletion
    console.log('Feature Flag mode: Pin deletion not supported');
  }
  
  private loadFeatureGraph(): void {
    this.featureGraphService.featureGraphObservable.subscribe(featureGraph => {
      if (featureGraph) {
        this.convertFeaturesToNodes(featureGraph);
      }
    });
  }
  
  private convertFeaturesToNodes(featureGraph: FeatureGraph): void {
    // Reset to defaults first to clear existing nodes
    this.graphState.resetToDefaults();
    
    const nodes: GraphNode[] = [];
    const spacing = 200; // Space between nodes
    let x = 100;
    let y = 100;
    
    // Convert features to visual nodes
    featureGraph.features.forEach((feature, index) => {
      const node: GraphNode = {
        id: `feature-${feature.id}`,
        type: this.featureGraphService.isFeatureEnabled(feature.name) ? 'feature-enabled' : 'feature-disabled',
        x: x + (index % 3) * spacing,
        y: y + Math.floor(index / 3) * spacing,
        width: 140,
        height: 80,
        label: feature.name,
        pins: []
      };
      
      // Add pins for dependencies (input pins)
      if (feature.dependencies && feature.dependencies.length > 0) {
        feature.dependencies.forEach((dep, depIndex) => {
          node.pins!.push({
            x: -10,
            y: 20 + depIndex * 20,
            name: `dep-${dep}`
          });
        });
      }
      
      // Add output pin for features that depend on this one
      const dependents = this.findDependents(feature.name, featureGraph);
      if (dependents.length > 0) {
        node.pins!.push({
          x: node.width + 10,
          y: node.height / 2,
          name: `out-${feature.name}`
        });
      }
      
      nodes.push(node);
    });
    
    // Add nodes to graph state
    nodes.forEach(node => {
      this.graphState.addNode(node);
    });
    
    console.log(`Feature Flag mode: Loaded ${nodes.length} feature nodes`);
  }
  
  private updateFeatureNodeVisual(node: GraphNode, featureName: string): void {
    const isEnabled = this.featureGraphService.isFeatureEnabled(featureName);
    
    // Update node visual representation by setting the type
    node.type = isEnabled ? 'feature-enabled' : 'feature-disabled';
    
    // Update the node in the graph state to trigger UI refresh
    this.graphState.updateNode(node.id, node);
  }
  
  private findDependents(featureName: string, featureGraph: FeatureGraph): string[] {
    return featureGraph.features
      .filter(f => f.dependencies && f.dependencies.includes(featureName))
      .map(f => f.name);
  }
  
  private resetToDefaults(): void {
    // This would reset features to their default state
    // For now, just reload the feature graph
    console.log('Feature Flag mode: Resetting to defaults');
    this.featureGraphService.loadFeatures().then(() => {
      this.loadFeatureGraph();
    });
  }
  
  private enableAllCompatible(): void {
    // Enable all features that don't have unsatisfied dependencies
    console.log('Feature Flag mode: Enabling all compatible features');
    // This would require more sophisticated dependency resolution
  }
  
  private toggleSelectedFeature(): void {
    // This method would need access to the component's selected nodes
    // For now, we'll handle feature toggling through node clicks
    console.log('Feature Flag mode: Use node clicks to toggle features');
  }
  
  private renderFeatureStateOverlay(canvas: SVGElement): void {
    // Add visual overlays to show feature states and dependencies
    // This could include dependency connection lines, state indicators, etc.
    const overlay = canvas.querySelector('.feature-flag-overlay');
    if (!overlay) {
      const overlayElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      overlayElement.classList.add('feature-flag-overlay');
      canvas.appendChild(overlayElement);
    }
  }
}