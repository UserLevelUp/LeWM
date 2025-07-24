import { GraphMode } from '../interfaces/graph-mode.interface';
import { GraphStateService } from '../services/graph-state.service';
import { GraphNode } from '../models/graph-node.model';

export class NormalMode implements GraphMode {
  name = 'normal';
  displayName = 'Normal';
  isActive = false;
  selectedPins = new Set<string>(); // Normal mode doesn't select pins
  
  constructor(private graphState: GraphStateService) {}
  
  activate(): void {
    console.log('Normal mode activated');
    this.selectedPins.clear();
    
    // Ensure we have the latest user changes when activating normal mode
    // The GraphStateService should already be using priority loading,
    // but we can trigger a reload if needed
    this.ensureLatestNormalModeState();
  }

  deactivate(): void {
    console.log('Normal mode deactivated');
    this.selectedPins.clear();
    
    // Save current state before leaving normal mode
    this.graphState.saveNormalModeState();
  }

  /**
   * Ensure that normal mode displays the latest user changes
   */
  private ensureLatestNormalModeState(): void {
    // The GraphStateService will automatically load from priority storage
    // (sessionStorage -> localStorage -> default file) during initialization.
    // No additional action needed here as the service handles this automatically.
    console.log('Normal mode: Latest state should be loaded via priority storage');
  }
  
  handleNodeClick(node: GraphNode, event: MouseEvent): boolean {
    // In normal mode, this handles node selection and dragging
    // Return false to let the component handle it with existing logic
    return false;
  }
  
  handlePinClick(node: GraphNode, pin: { x: number; y: number; name: string }, event: MouseEvent): boolean {
    // In normal mode, this handles connection creation
    // Return false to let the component handle it with existing logic
    return false;
  }
  
  handleCanvasClick(event: MouseEvent): boolean {
    // In normal mode, this handles selection clearing and selection box
    // Return false to let the component handle it with existing logic
    return false;
  }
  
  handleMouseMove(event: MouseEvent): boolean {
    // Normal mode doesn't handle mouse move specially
    return false;
  }
  
  handleKeyDown(event: KeyboardEvent): boolean {
    // Handle mode-specific keyboard shortcuts
    if (event.key === 'p' || event.key === 'P') {
      // Switch to pin edit mode (will be handled by component)
      return true;
    }
    
    if (event.key === 'Enter') {
      // If nodes are selected, allow component to handle node name editing
      return true;
    }
    
    // Return false to let component handle other keys (delete, ctrl, etc.)
    return false;
  }
  
  renderOverlay(): void {
    // Normal mode doesn't render any overlay
  }
  
  getCursor(): string {
    return 'default';
  }
  
  deleteSelectedPins(): void {
    // No pin deletion in normal mode
  }
}