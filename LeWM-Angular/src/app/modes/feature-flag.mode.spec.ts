import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FeatureFlagMode } from './feature-flag.mode';
import { FeatureGraphService } from '../services/feature-graph.service';
import { GraphStateService } from '../services/graph-state.service';
import { GraphNode } from '../models/graph-node.model';

describe('FeatureFlagMode', () => {
  let mode: FeatureFlagMode;
  let mockFeatureGraphService: jasmine.SpyObj<FeatureGraphService>;
  let mockGraphState: jasmine.SpyObj<GraphStateService>;

  beforeEach(() => {
    const featureGraphServiceSpy = jasmine.createSpyObj('FeatureGraphService', [
      'isFeatureEnabled', 
      'toggleFeature', 
      'featureGraphObservable'
    ]);
    const graphStateSpy = jasmine.createSpyObj('GraphStateService', [
      'resetToDefaults', 
      'addNode', 
      'updateNode',
      'clearNodes'
    ]);

    // Mock the observable
    featureGraphServiceSpy.featureGraphObservable = of({
      features: [
        { id: 'test-feature', name: 'test-feature', enabled: true },
        { id: 'test-disabled', name: 'test-disabled', enabled: false, dependencies: ['test-feature'] }
      ]
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: FeatureGraphService, useValue: featureGraphServiceSpy },
        { provide: GraphStateService, useValue: graphStateSpy }
      ]
    });

    mockFeatureGraphService = TestBed.inject(FeatureGraphService) as jasmine.SpyObj<FeatureGraphService>;
    mockGraphState = TestBed.inject(GraphStateService) as jasmine.SpyObj<GraphStateService>;
    
    mode = new FeatureFlagMode(mockFeatureGraphService, mockGraphState);
  });

  it('should create', () => {
    expect(mode).toBeTruthy();
  });

  it('should have correct mode properties', () => {
    expect(mode.name).toBe('feature-flag');
    expect(mode.displayName).toBe('Feature Flags');
    expect(mode.isActive).toBe(false);
    expect(mode.selectedPins).toEqual(new Set<string>());
  });

  it('should activate and load feature graph', () => {
    spyOn(mode as any, 'loadFeatureGraph');
    
    mode.activate();
    
    expect(mode.isActive).toBe(false); // Note: isActive is set by ModeManager
    expect((mode as any).loadFeatureGraph).toHaveBeenCalled();
    expect(mode.selectedPins.size).toBe(0);
  });

  it('should deactivate and reset graph state', () => {
    mode.deactivate();
    
    expect(mockGraphState.resetToDefaults).toHaveBeenCalled();
    expect(mode.selectedPins.size).toBe(0);
  });

  it('should handle node clicks and toggle features', () => {
    const mockNode: GraphNode = {
      id: 'test-node',
      type: 'feature-enabled',
      x: 100,
      y: 100,
      width: 120,
      height: 80,
      label: 'test-feature'
    };
    const mockEvent = new MouseEvent('click');

    mockFeatureGraphService.toggleFeature.and.stub();
    spyOn(mode as any, 'updateFeatureNodeVisual');

    const result = mode.handleNodeClick(mockNode, mockEvent);

    expect(result).toBe(true);
    expect(mockFeatureGraphService.toggleFeature).toHaveBeenCalledWith('test-feature');
    expect((mode as any).updateFeatureNodeVisual).toHaveBeenCalledWith(mockNode, 'test-feature');
  });

  it('should handle node clicks with ctrl key for multi-select', () => {
    const mockNode: GraphNode = {
      id: 'test-node',
      type: 'feature-enabled',
      x: 100,
      y: 100,
      width: 120,
      height: 80,
      label: 'test-feature'
    };
    const mockEvent = new MouseEvent('click', { ctrlKey: true });

    const result = mode.handleNodeClick(mockNode, mockEvent);

    expect(result).toBe(false); // Should let component handle multi-selection
    expect(mockFeatureGraphService.toggleFeature).not.toHaveBeenCalled();
  });

  it('should handle pin clicks as read-only', () => {
    const mockNode: GraphNode = {
      id: 'test-node',
      type: 'feature-enabled',
      x: 100,
      y: 100,
      width: 120,
      height: 80,
      label: 'test-feature'
    };
    const mockPin = { x: 10, y: 10, name: 'test-pin' };
    const mockEvent = new MouseEvent('click');

    const result = mode.handlePinClick(mockNode, mockPin, mockEvent);

    expect(result).toBe(false); // Let component handle pin reference rectangles
  });

  it('should handle keyboard shortcuts', () => {
    spyOn(mode as any, 'resetToDefaults');
    spyOn(mode as any, 'enableAllCompatible');
    spyOn(mode as any, 'toggleSelectedFeature');

    // Test 'r' key for reset
    let event = new KeyboardEvent('keydown', { key: 'r' });
    spyOn(event, 'preventDefault');
    let result = mode.handleKeyDown(event);
    expect(result).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect((mode as any).resetToDefaults).toHaveBeenCalled();

    // Test 'e' key for enable all
    event = new KeyboardEvent('keydown', { key: 'e' });
    spyOn(event, 'preventDefault');
    result = mode.handleKeyDown(event);
    expect(result).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect((mode as any).enableAllCompatible).toHaveBeenCalled();

    // Test 'enter' key for toggle selected
    event = new KeyboardEvent('keydown', { key: 'enter' });
    spyOn(event, 'preventDefault');
    result = mode.handleKeyDown(event);
    expect(result).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect((mode as any).toggleSelectedFeature).toHaveBeenCalled();

    // Test unhandled key
    event = new KeyboardEvent('keydown', { key: 'x' });
    result = mode.handleKeyDown(event);
    expect(result).toBe(false);
  });

  it('should return pointer cursor', () => {
    expect(mode.getCursor()).toBe('pointer');
  });

  it('should handle deleteSelectedPins as no-op', () => {
    spyOn(console, 'log');
    
    mode.deleteSelectedPins();
    
    expect(console.log).toHaveBeenCalledWith('Feature Flag mode: Pin deletion not supported');
  });

  it('should handle canvas clicks by delegating to component', () => {
    const mockEvent = new MouseEvent('click');
    
    const result = mode.handleCanvasClick(mockEvent);
    
    expect(result).toBe(false); // Let component handle
  });

  it('should handle mouse move by delegating to component', () => {
    const mockEvent = new MouseEvent('mousemove');
    
    const result = mode.handleMouseMove(mockEvent);
    
    expect(result).toBe(false); // Let component handle
  });
});