import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HandleComponent } from './handle';
import { LayoutStateService } from '../../services/layout-state.service';

describe('HandleComponent', () => {
  let component: HandleComponent;
  let fixture: ComponentFixture<HandleComponent>;
  let layoutStateService: LayoutStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HandleComponent],
      providers: [LayoutStateService]
    }).compileComponents();

    fixture = TestBed.createComponent(HandleComponent);
    component = fixture.componentInstance;
    layoutStateService = TestBed.inject(LayoutStateService);
    fixture.detectChanges();
  });

  afterEach(() => {
    // Service State Cleanup
    // Reset LayoutStateService resizing state
    layoutStateService.setResizing(false);
    
    // Component State Cleanup
    // Destroy component fixture
    if (fixture) {
      fixture.destroy();
    }
    
    // Remove any event listeners that might be left
    // Note: Component has bound event handlers that we should clean up
    document.removeEventListener('mousemove', (component as any).resizeMoveHandler);
    document.removeEventListener('mouseup', (component as any).resizeEndHandler);
    
    // Clear any test-specific DOM elements
    document.querySelectorAll('[data-test], .handle').forEach(el => el.remove());
    
    // Reset any global state
    delete (window as any).testGlobals;
    delete (window as any).resizeState;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have resize output event', () => {
    expect(component.positionChange).toBeDefined();
    expect(component.positionChange.emit).toBeDefined();
  });

  it('should have resizeStart output event', () => {
    expect(component.positionChangeStart).toBeDefined();
    expect(component.positionChangeStart.emit).toBeDefined();
  });

  it('should have resizeEnd output event', () => {
    expect(component.positionChangeEnd).toBeDefined();
    expect(component.positionChangeEnd.emit).toBeDefined();
  });

  it('should not be resizing initially', () => {
    expect(component.resizing).toBe(false);
  });

  it('should emit resizeStart when mousedown occurs', () => {
    spyOn(component.positionChangeStart, 'emit');
    spyOn(layoutStateService, 'setResizing');
    const event = new MouseEvent('mousedown', { clientX: 100 });
    
    component.onResizeStart(event);
    
    expect(component.positionChangeStart.emit).toHaveBeenCalled();
    expect(component.resizing).toBe(true);
    expect(layoutStateService.setResizing).toHaveBeenCalledWith(true);
  });

  it('should clean up event listeners on destroy', () => {
    spyOn(document, 'removeEventListener');
    spyOn(layoutStateService, 'setResizing');
    
    component.ngOnDestroy();
    
    expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', jasmine.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('mouseup', jasmine.any(Function));
  });

  it('should clear global resize state when destroyed during resize', () => {
    spyOn(layoutStateService, 'setResizing');
    const event = new MouseEvent('mousedown', { clientX: 100 });
    
    // Start resizing
    component.onResizeStart(event);
    expect(layoutStateService.setResizing).toHaveBeenCalledWith(true);
    
    // Destroy while resizing
    component.ngOnDestroy();
    expect(layoutStateService.setResizing).toHaveBeenCalledWith(false);
  });

  // Tests for new orientation functionality
  it('should default to vertical orientation', () => {
    expect(component.orientation).toBe('vertical');
    expect(component.isVertical).toBe(true);
    expect(component.isHorizontal).toBe(false);
  });

  it('should support horizontal orientation', () => {
    component.orientation = 'horizontal';
    fixture.detectChanges();
    
    expect(component.isVertical).toBe(false);
    expect(component.isHorizontal).toBe(true);
  });

  it('should emit deltaX for vertical orientation', () => {
    spyOn(component.positionChange, 'emit');
    component.orientation = 'vertical';
    
    // Start resize
    const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
    component.onResizeStart(startEvent);
    
    // Simulate mouse move
    const moveEvent = new MouseEvent('mousemove', { clientX: 120, clientY: 110 });
    document.dispatchEvent(moveEvent);
    
    expect(component.positionChange.emit).toHaveBeenCalledWith(20); // deltaX = 120 - 100
  });

  it('should emit deltaY for horizontal orientation', () => {
    spyOn(component.positionChange, 'emit');
    component.orientation = 'horizontal';
    
    // Start resize
    const startEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
    component.onResizeStart(startEvent);
    
    // Simulate mouse move
    const moveEvent = new MouseEvent('mousemove', { clientX: 120, clientY: 110 });
    document.dispatchEvent(moveEvent);
    
    expect(component.positionChange.emit).toHaveBeenCalledWith(10); // deltaY = 110 - 100
  });

  it('should clear global resize state on resize end', () => {
    spyOn(component.positionChangeEnd, 'emit');
    spyOn(layoutStateService, 'setResizing');
    const startEvent = new MouseEvent('mousedown', { clientX: 100 });
    
    // Start resize
    component.onResizeStart(startEvent);
    expect(layoutStateService.setResizing).toHaveBeenCalledWith(true);
    
    // End resize
    const endEvent = new MouseEvent('mouseup');
    document.dispatchEvent(endEvent);
    
    expect(layoutStateService.setResizing).toHaveBeenCalledWith(false);
    expect(component.positionChangeEnd.emit).toHaveBeenCalled();
  });
});