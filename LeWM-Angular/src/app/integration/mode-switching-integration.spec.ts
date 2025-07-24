import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { GraphStateService } from '../services/graph-state.service';
import { ConnectionStateService } from '../services/connection-state.service';
import { FeatureGraphService } from '../services/feature-graph.service';
import { NormalMode } from '../modes/normal.mode';
import { FeatureFlagMode } from '../modes/feature-flag.mode';
import { GraphNode } from '../models/graph-node.model';

describe('Mode Switching Integration', () => {
  let graphStateService: GraphStateService;
  let featureGraphService: FeatureGraphService;
  let normalMode: NormalMode;
  let featureFlagMode: FeatureFlagMode;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GraphStateService, ConnectionStateService, FeatureGraphService]
    });

    graphStateService = TestBed.inject(GraphStateService);
    featureGraphService = TestBed.inject(FeatureGraphService);
    
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
    
    // Wait for graph state service to initialize
    await graphStateService.waitForInitialization();
    
    // Initialize feature graph service
    await featureGraphService.loadFeatures();
    
    normalMode = new NormalMode(graphStateService);
    featureFlagMode = new FeatureFlagMode(featureGraphService, graphStateService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should preserve user changes when switching between normal and feature flag modes', async () => {
    // Step 1: User makes changes in normal mode
    normalMode.activate();
    
    const userNode: GraphNode = {
      id: 'user-circuit-node',
      type: 'resistor',
      x: 200,
      y: 300,
      width: 60,
      height: 20,
      label: 'User Resistor 220Ω',
      pins: [
        { x: 0, y: 10, name: 'A' },
        { x: 60, y: 10, name: 'B' }
      ]
    };
    
    graphStateService.addNode(userNode);
    
    // Verify the user node is present
    expect(graphStateService.getNodes()).toContain(jasmine.objectContaining({
      id: 'user-circuit-node',
      label: 'User Resistor 220Ω'
    }));

    normalMode.deactivate();

    // Step 2: Switch to feature flag mode
    featureFlagMode.activate();
    
    // Verify feature flag mode clears the canvas (no circuit nodes should be visible)
    const featureFlagNodes = graphStateService.getNodes();
    expect(featureFlagNodes.find(n => n.id === 'user-circuit-node')).toBeUndefined();
    
    // Feature flag mode should show feature nodes
    // (The exact nodes depend on the feature graph configuration)
    
    // Step 3: Switch back to normal mode
    featureFlagMode.deactivate();
    normalMode.activate();
    
    // Step 4: Verify user changes are restored
    const restoredNodes = graphStateService.getNodes();
    expect(restoredNodes).toContain(jasmine.objectContaining({
      id: 'user-circuit-node',
      label: 'User Resistor 220Ω'
    }));
    
    // Verify no feature flag nodes are visible in normal mode
    const featureNodePattern = /^feature-/;
    const hasFeatureNodes = restoredNodes.some(node => featureNodePattern.test(node.id));
    expect(hasFeatureNodes).toBe(false);
  });

  it('should handle multiple mode switches without data loss', async () => {
    // Multiple mode switching scenario
    normalMode.activate();
    
    // Add multiple user nodes
    const userNode1: GraphNode = {
      id: 'user-node-1',
      type: 'power',
      x: 100,
      y: 150,
      width: 80,
      height: 60,
      label: 'User Battery',
      pins: [{ x: 80, y: 20, name: '+' }, { x: 80, y: 40, name: '-' }]
    };
    
    const userNode2: GraphNode = {
      id: 'user-node-2',
      type: 'led',
      x: 250,
      y: 200,
      width: 30,
      height: 20,
      label: 'User LED',
      pins: [{ x: 0, y: 10, name: 'A' }, { x: 30, y: 10, name: 'K' }]
    };
    
    graphStateService.addNode(userNode1);
    graphStateService.addNode(userNode2);
    
    // Move a node to test position updates
    const positionUpdates = new Map();
    positionUpdates.set('user-node-1', { x: 120, y: 170 });
    graphStateService.updateNodePositions(positionUpdates);
    
    normalMode.deactivate();

    // First switch to feature flag mode
    featureFlagMode.activate();
    featureFlagMode.deactivate();
    
    // Switch back to normal
    normalMode.activate();
    
    // Verify all changes are preserved
    const nodes = graphStateService.getNodes();
    expect(nodes).toContain(jasmine.objectContaining({
      id: 'user-node-1',
      x: 120,
      y: 170
    }));
    expect(nodes).toContain(jasmine.objectContaining({
      id: 'user-node-2'
    }));
    
    normalMode.deactivate();

    // Second switch to feature flag mode
    featureFlagMode.activate();
    featureFlagMode.deactivate();
    
    // Switch back to normal again
    normalMode.activate();
    
    // Verify changes are still preserved after multiple switches
    const finalNodes = graphStateService.getNodes();
    expect(finalNodes).toContain(jasmine.objectContaining({
      id: 'user-node-1',
      x: 120,
      y: 170
    }));
    expect(finalNodes).toContain(jasmine.objectContaining({
      id: 'user-node-2'
    }));
  });

  it('should handle gracefully when no previous normal mode state exists', async () => {
    // Switch to feature flag mode without any previous normal mode state
    featureFlagMode.activate();
    featureFlagMode.deactivate();
    
    // This should not crash and should fall back to defaults
    normalMode.activate();
    
    // Should have some default nodes (may be empty or default circuit)
    expect(graphStateService.getNodes).not.toThrow();
  });
});