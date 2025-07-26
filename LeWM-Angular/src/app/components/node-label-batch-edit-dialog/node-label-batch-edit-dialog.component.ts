import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GraphNode, NodeLabelStyle, NodeLabelPosition } from '../../models/graph-node.model';

export interface NodeLabelBatchEditResult {
  nodeId: string;
  label?: string;
  labelPosition?: NodeLabelPosition;
  labelStyle?: NodeLabelStyle;
}

@Component({
  selector: 'app-node-label-batch-edit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="batch-label-dialog-overlay" *ngIf="isVisible" (click)="onOverlayClick()" tabindex="0">
      <div class="batch-label-dialog" (click)="$event.stopPropagation()" tabindex="0">
        <div class="batch-label-dialog-header">
          <h4>Edit Labels for {{ nodes.length }} Nodes</h4>
        </div>
        <div class="batch-label-dialog-body">
          <!-- Global Position Controls -->
          <div class="form-section">
            <h5>Apply Position to All</h5>
            <div class="checkbox-group">
              <input type="checkbox" id="applyPosition" [(ngModel)]="applyPosition">
              <label for="applyPosition">Apply position changes to all selected nodes</label>
            </div>
            <div class="form-row" *ngIf="applyPosition">
              <div class="form-group">
                <label for="globalOffsetX">X Offset:</label>
                <input 
                  type="number" 
                  id="globalOffsetX" 
                  [(ngModel)]="globalOffsetX" 
                  class="number-input"
                  step="1">
              </div>
              <div class="form-group">
                <label for="globalOffsetY">Y Offset:</label>
                <input 
                  type="number" 
                  id="globalOffsetY" 
                  [(ngModel)]="globalOffsetY" 
                  class="number-input"
                  step="1">
              </div>
            </div>
          </div>

          <!-- Global Alignment Controls -->
          <div class="form-section">
            <h5>Apply Alignment to All</h5>
            <div class="checkbox-group">
              <input type="checkbox" id="applyAlignment" [(ngModel)]="applyAlignment">
              <label for="applyAlignment">Apply alignment changes to all selected nodes</label>
            </div>
            <div class="form-row" *ngIf="applyAlignment">
              <div class="form-group">
                <label for="globalAlignment">Horizontal:</label>
                <select id="globalAlignment" [(ngModel)]="globalAlignment" class="select-input">
                  <option value="start">Left</option>
                  <option value="middle">Center</option>
                  <option value="end">Right</option>
                </select>
              </div>
              <div class="form-group">
                <label for="globalVerticalAlignment">Vertical:</label>
                <select id="globalVerticalAlignment" [(ngModel)]="globalVerticalAlignment" class="select-input">
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Global Style Controls -->
          <div class="form-section">
            <h5>Apply Style to All</h5>
            <div class="checkbox-group">
              <input type="checkbox" id="applyStyle" [(ngModel)]="applyStyle">
              <label for="applyStyle">Apply style changes to all selected nodes</label>
            </div>
            <div *ngIf="applyStyle">
              <div class="form-row">
                <div class="form-group">
                  <label for="globalFontSize">Font Size:</label>
                  <input 
                    type="number" 
                    id="globalFontSize" 
                    [(ngModel)]="globalFontSize" 
                    class="number-input"
                    min="8" 
                    max="48" 
                    step="1">
                </div>
                <div class="form-group">
                  <label for="globalFontWeight">Font Weight:</label>
                  <select id="globalFontWeight" [(ngModel)]="globalFontWeight" class="select-input">
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Lighter</option>
                    <option value="bolder">Bolder</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="globalFontFamily">Font Family:</label>
                  <select id="globalFontFamily" [(ngModel)]="globalFontFamily" class="select-input">
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Times New Roman, serif">Times New Roman</option>
                    <option value="Courier New, monospace">Courier New</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="globalColor">Color:</label>
                  <input 
                    type="color" 
                    id="globalColor" 
                    [(ngModel)]="globalColor" 
                    class="color-input">
                </div>
              </div>
              <div class="checkbox-group">
                <input type="checkbox" id="globalWrap" [(ngModel)]="globalWrap">
                <label for="globalWrap">Enable text wrapping</label>
              </div>
              <div class="form-group" *ngIf="globalWrap">
                <label for="globalMaxWidth">Max Width (for wrapping):</label>
                <input 
                  type="number" 
                  id="globalMaxWidth" 
                  [(ngModel)]="globalMaxWidth" 
                  class="number-input"
                  min="50" 
                  step="10">
              </div>
            </div>
          </div>

          <!-- Individual Node Labels -->
          <div class="form-section">
            <h5>Individual Label Text</h5>
            <div class="node-list">
              <div *ngFor="let nodeData of nodeDataList; trackBy: trackByNodeId" class="node-item">
                <div class="node-header">
                  <strong>{{ nodeData.node.id }}</strong>
                  <span class="node-type">({{ nodeData.node.type }})</span>
                </div>
                <div class="form-group">
                  <label [for]="'label-' + nodeData.node.id">Label:</label>
                  <input 
                    type="text" 
                    [id]="'label-' + nodeData.node.id"
                    [(ngModel)]="nodeData.label" 
                    class="label-input"
                    [placeholder]="'Current: ' + nodeData.node.label">
                </div>
              </div>
            </div>
          </div>
            
          <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
        </div>
        <div class="batch-label-dialog-footer">
          <button type="button" class="btn btn-cancel" (click)="onCancel()">Cancel</button>
          <button type="button" class="btn btn-reset" (click)="onReset()">Reset to Defaults</button>
          <button type="button" class="btn btn-ok" (click)="onOk()">Apply Changes</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .batch-label-dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .batch-label-dialog {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      min-width: 600px;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .batch-label-dialog-header {
      padding: 1rem 1.5rem 0.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .batch-label-dialog-header h4 {
      margin: 0;
      color: #333;
      font-size: 1.1rem;
    }

    .batch-label-dialog-body {
      padding: 1.5rem;
    }

    .form-section {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e9ecef;
    }

    .form-section:first-child {
      margin-top: 0;
      padding-top: 0;
      border-top: none;
    }

    .form-section h5 {
      margin: 0 0 1rem 0;
      color: #555;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .form-group {
      flex: 1;
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #555;
      font-size: 0.9rem;
    }

    .label-input, .number-input, .select-input, .color-input {
      width: 100%;
      padding: 0.5rem;
      border: 2px solid #e9ecef;
      border-radius: 4px;
      font-size: 0.9rem;
      transition: border-color 0.2s;
    }

    .color-input {
      height: 40px;
      padding: 0.25rem;
    }

    .label-input:focus, .number-input:focus, .select-input:focus {
      outline: none;
      border-color: #007bff;
    }

    .checkbox-group {
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .checkbox-group input[type="checkbox"] {
      width: auto;
    }

    .checkbox-group label {
      margin-bottom: 0;
      font-weight: normal;
      cursor: pointer;
    }

    .node-list {
      border: 1px solid #e9ecef;
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
    }

    .node-item {
      padding: 1rem;
      border-bottom: 1px solid #e9ecef;
    }

    .node-item:last-child {
      border-bottom: none;
    }

    .node-header {
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .node-type {
      color: #666;
      font-size: 0.85rem;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .batch-label-dialog-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e9ecef;
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }

    .btn-cancel {
      background: #6c757d;
      color: white;
    }

    .btn-cancel:hover {
      background: #5a6268;
    }

    .btn-reset {
      background: #ffc107;
      color: #212529;
    }

    .btn-reset:hover {
      background: #e0a800;
    }

    .btn-ok {
      background: #007bff;
      color: white;
    }

    .btn-ok:hover {
      background: #0056b3;
    }
  `]
})
export class NodeLabelBatchEditDialogComponent implements OnInit {
  @Input() isVisible = false;
  @Input() nodes: GraphNode[] = [];
  @Output() labelChanges = new EventEmitter<NodeLabelBatchEditResult[]>();
  @Output() cancelled = new EventEmitter<void>();

  // Global controls
  applyPosition = false;
  applyAlignment = false;
  applyStyle = false;

  // Global values
  globalOffsetX = 0;
  globalOffsetY = 0;
  globalAlignment: 'start' | 'middle' | 'end' = 'middle';
  globalVerticalAlignment: 'top' | 'middle' | 'bottom' = 'middle';
  globalFontSize = 12;
  globalFontWeight: 'normal' | 'bold' | 'lighter' | 'bolder' = 'bold';
  globalFontFamily = 'Arial, sans-serif';
  globalColor = '#333333';
  globalWrap = false;
  globalMaxWidth = 100;

  // Individual node data
  nodeDataList: { node: GraphNode, label: string }[] = [];

  errorMessage = '';

  ngOnInit(): void {
    this.initializeNodeData();
  }

  private initializeNodeData(): void {
    this.nodeDataList = this.nodes.map(node => ({
      node,
      label: node.label
    }));
  }

  trackByNodeId(index: number, item: { node: GraphNode, label: string }): string {
    return item.node.id;
  }

  onOk(): void {
    this.clearError();
    
    const changes: NodeLabelBatchEditResult[] = [];

    for (const nodeData of this.nodeDataList) {
      const change: NodeLabelBatchEditResult = {
        nodeId: nodeData.node.id
      };

      // Add label if changed
      if (nodeData.label !== nodeData.node.label) {
        change.label = nodeData.label;
      }

      // Add position if apply position is checked
      if (this.applyPosition) {
        change.labelPosition = {
          offsetX: this.globalOffsetX,
          offsetY: this.globalOffsetY
        };
      }

      // Add style if apply style is checked
      if (this.applyStyle) {
        change.labelStyle = {
          fontSize: this.globalFontSize,
          fontFamily: this.globalFontFamily,
          fontWeight: this.globalFontWeight,
          color: this.globalColor,
          alignment: this.globalAlignment,
          verticalAlignment: this.globalVerticalAlignment,
          wrap: this.globalWrap,
          maxWidth: this.globalWrap ? this.globalMaxWidth : undefined
        };
      } else if (this.applyAlignment) {
        // Apply only alignment if style is not applied but alignment is
        const currentStyle = nodeData.node.labelStyle || {
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold' as const,
          color: '#333333',
          alignment: 'middle' as const,
          verticalAlignment: 'middle' as const,
          wrap: false
        };
        
        change.labelStyle = {
          ...currentStyle,
          alignment: this.globalAlignment,
          verticalAlignment: this.globalVerticalAlignment
        };
      }

      // Only include changes that have modifications
      if (change.label !== undefined || change.labelPosition !== undefined || change.labelStyle !== undefined) {
        changes.push(change);
      }
    }

    this.labelChanges.emit(changes);
  }

  onCancel(): void {
    this.cancelled.emit();
    this.reset();
  }

  onReset(): void {
    this.applyPosition = false;
    this.applyAlignment = false;
    this.applyStyle = false;
    this.globalOffsetX = 0;
    this.globalOffsetY = 0;
    this.globalAlignment = 'middle';
    this.globalVerticalAlignment = 'middle';
    this.globalFontSize = 12;
    this.globalFontWeight = 'bold';
    this.globalFontFamily = 'Arial, sans-serif';
    this.globalColor = '#333333';
    this.globalWrap = false;
    this.globalMaxWidth = 100;
    
    // Reset individual labels to original values
    this.nodeDataList = this.nodes.map(node => ({
      node,
      label: node.label
    }));
    
    this.clearError();
  }

  onOverlayClick(): void {
    this.onCancel();
  }

  reset(): void {
    this.applyPosition = false;
    this.applyAlignment = false;
    this.applyStyle = false;
    this.globalOffsetX = 0;
    this.globalOffsetY = 0;
    this.globalAlignment = 'middle';
    this.globalVerticalAlignment = 'middle';
    this.globalFontSize = 12;
    this.globalFontWeight = 'bold';
    this.globalFontFamily = 'Arial, sans-serif';
    this.globalColor = '#333333';
    this.globalWrap = false;
    this.globalMaxWidth = 100;
    this.nodeDataList = [];
    this.errorMessage = '';
    this.isVisible = false;
  }

  private clearError(): void {
    this.errorMessage = '';
  }

  showError(message: string): void {
    this.errorMessage = message;
  }

  show(nodes: GraphNode[]): void {
    this.nodes = nodes;
    this.initializeNodeData();
    this.isVisible = true;
    this.errorMessage = '';
  }
}