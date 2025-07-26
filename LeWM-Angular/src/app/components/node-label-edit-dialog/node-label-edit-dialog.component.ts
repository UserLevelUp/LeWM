import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GraphNode, NodeLabelStyle, NodeLabelPosition } from '../../models/graph-node.model';

export interface NodeLabelEditResult {
  label: string;
  labelPosition: NodeLabelPosition;
  labelStyle: NodeLabelStyle;
}

@Component({
  selector: 'app-node-label-edit-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="label-dialog-overlay" *ngIf="isVisible" (click)="onOverlayClick()" tabindex="0">
      <div class="label-dialog" (click)="$event.stopPropagation()" tabindex="0">
        <div class="label-dialog-header">
          <h4>Edit Node Label</h4>
        </div>
        <div class="label-dialog-body">
          <!-- Label Text -->
          <div class="form-group">
            <label for="labelText">Label Text:</label>
            <textarea 
              #labelInput
              id="labelText" 
              [(ngModel)]="labelText" 
              (keydown)="onKeyDown($event)"
              placeholder="Enter label text..."
              class="label-input"
              [class.error]="errorMessage"
              rows="3">
            </textarea>
            <div class="checkbox-group">
              <input type="checkbox" id="labelWrap" [(ngModel)]="labelWrap">
              <label for="labelWrap">Enable text wrapping</label>
            </div>
          </div>

          <!-- Position Controls -->
          <div class="form-section">
            <h5>Position</h5>
            <div class="form-row">
              <div class="form-group">
                <label for="offsetX">X Offset:</label>
                <input 
                  type="number" 
                  id="offsetX" 
                  [(ngModel)]="offsetX" 
                  class="number-input"
                  step="1">
              </div>
              <div class="form-group">
                <label for="offsetY">Y Offset:</label>
                <input 
                  type="number" 
                  id="offsetY" 
                  [(ngModel)]="offsetY" 
                  class="number-input"
                  step="1">
              </div>
            </div>
          </div>

          <!-- Alignment Controls -->
          <div class="form-section">
            <h5>Alignment</h5>
            <div class="form-row">
              <div class="form-group">
                <label for="alignment">Horizontal:</label>
                <select id="alignment" [(ngModel)]="alignment" class="select-input">
                  <option value="start">Left</option>
                  <option value="middle">Center</option>
                  <option value="end">Right</option>
                </select>
              </div>
              <div class="form-group">
                <label for="verticalAlignment">Vertical:</label>
                <select id="verticalAlignment" [(ngModel)]="verticalAlignment" class="select-input">
                  <option value="top">Top</option>
                  <option value="middle">Middle</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Style Controls -->
          <div class="form-section">
            <h5>Style</h5>
            <div class="form-row">
              <div class="form-group">
                <label for="fontSize">Font Size:</label>
                <input 
                  type="number" 
                  id="fontSize" 
                  [(ngModel)]="fontSize" 
                  class="number-input"
                  min="8" 
                  max="48" 
                  step="1">
              </div>
              <div class="form-group">
                <label for="fontWeight">Font Weight:</label>
                <select id="fontWeight" [(ngModel)]="fontWeight" class="select-input">
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="lighter">Lighter</option>
                  <option value="bolder">Bolder</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="fontFamily">Font Family:</label>
                <select id="fontFamily" [(ngModel)]="fontFamily" class="select-input">
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Helvetica, sans-serif">Helvetica</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Courier New, monospace">Courier New</option>
                  <option value="Verdana, sans-serif">Verdana</option>
                </select>
              </div>
              <div class="form-group">
                <label for="color">Color:</label>
                <input 
                  type="color" 
                  id="color" 
                  [(ngModel)]="color" 
                  class="color-input">
              </div>
            </div>
            <div class="form-group" *ngIf="labelWrap">
              <label for="maxWidth">Max Width (for wrapping):</label>
              <input 
                type="number" 
                id="maxWidth" 
                [(ngModel)]="maxWidth" 
                class="number-input"
                min="50" 
                step="10">
            </div>
          </div>
            
          <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
        </div>
        <div class="label-dialog-footer">
          <button type="button" class="btn btn-cancel" (click)="onCancel()">Cancel</button>
          <button type="button" class="btn btn-reset" (click)="onReset()">Reset to Default</button>
          <button type="button" class="btn btn-ok" (click)="onOk()" [disabled]="!labelText.trim()">OK</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .label-dialog-overlay {
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

    .label-dialog {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      min-width: 500px;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .label-dialog-header {
      padding: 1rem 1.5rem 0.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .label-dialog-header h4 {
      margin: 0;
      color: #333;
      font-size: 1.1rem;
    }

    .label-dialog-body {
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

    .label-input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e9ecef;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s;
      resize: vertical;
    }

    .number-input, .select-input, .color-input {
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

    .label-input.error {
      border-color: #dc3545;
    }

    .checkbox-group {
      margin-top: 0.5rem;
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

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .label-dialog-footer {
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

    .btn-ok:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-ok:disabled {
      background: #e9ecef;
      color: #6c757d;
      cursor: not-allowed;
    }
  `]
})
export class NodeLabelEditDialogComponent implements OnInit {
  @Input() isVisible = false;
  @Input() node: GraphNode | null = null;
  @Output() labelChanged = new EventEmitter<NodeLabelEditResult>();
  @Output() cancelled = new EventEmitter<void>();

  // Form fields
  labelText = '';
  labelWrap = false;
  offsetX = 0;
  offsetY = 0;
  alignment: 'start' | 'middle' | 'end' = 'middle';
  verticalAlignment: 'top' | 'middle' | 'bottom' = 'middle';
  fontSize = 12;
  fontWeight: 'normal' | 'bold' | 'lighter' | 'bolder' = 'bold';
  fontFamily = 'Arial, sans-serif';
  color = '#333333';
  maxWidth = 100;
  errorMessage = '';

  // Default values
  private defaultValues = {
    labelText: '',
    labelWrap: false,
    offsetX: 0,
    offsetY: 0,
    alignment: 'middle' as const,
    verticalAlignment: 'middle' as const,
    fontSize: 12,
    fontWeight: 'bold' as const,
    fontFamily: 'Arial, sans-serif',
    color: '#333333',
    maxWidth: 100
  };

  ngOnInit(): void {
    this.loadNodeData();
  }

  private loadNodeData(): void {
    if (!this.node) return;

    // Load label text
    this.labelText = this.node.label || '';

    // Load position
    const position = this.node.labelPosition;
    this.offsetX = position?.offsetX ?? this.defaultValues.offsetX;
    this.offsetY = position?.offsetY ?? this.defaultValues.offsetY;

    // Load style
    const style = this.node.labelStyle;
    this.fontSize = style?.fontSize ?? this.defaultValues.fontSize;
    this.fontWeight = style?.fontWeight ?? this.defaultValues.fontWeight;
    this.fontFamily = style?.fontFamily ?? this.defaultValues.fontFamily;
    this.color = style?.color ?? this.defaultValues.color;
    this.alignment = style?.alignment ?? this.defaultValues.alignment;
    this.verticalAlignment = style?.verticalAlignment ?? this.defaultValues.verticalAlignment;
    this.labelWrap = style?.wrap ?? this.defaultValues.labelWrap;
    this.maxWidth = style?.maxWidth ?? this.defaultValues.maxWidth;
  }

  onOk(): void {
    if (this.labelText.trim()) {
      this.clearError();
      
      const position: NodeLabelPosition = {
        offsetX: this.offsetX,
        offsetY: this.offsetY
      };

      const style: NodeLabelStyle = {
        fontSize: this.fontSize,
        fontFamily: this.fontFamily,
        fontWeight: this.fontWeight,
        color: this.color,
        alignment: this.alignment,
        verticalAlignment: this.verticalAlignment,
        wrap: this.labelWrap,
        maxWidth: this.labelWrap ? this.maxWidth : undefined
      };

      this.labelChanged.emit({
        label: this.labelText.trim(),
        labelPosition: position,
        labelStyle: style
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
    this.reset();
  }

  onReset(): void {
    this.labelText = this.defaultValues.labelText;
    this.labelWrap = this.defaultValues.labelWrap;
    this.offsetX = this.defaultValues.offsetX;
    this.offsetY = this.defaultValues.offsetY;
    this.alignment = this.defaultValues.alignment;
    this.verticalAlignment = this.defaultValues.verticalAlignment;
    this.fontSize = this.defaultValues.fontSize;
    this.fontWeight = this.defaultValues.fontWeight;
    this.fontFamily = this.defaultValues.fontFamily;
    this.color = this.defaultValues.color;
    this.maxWidth = this.defaultValues.maxWidth;
    this.clearError();
  }

  onOverlayClick(): void {
    this.onCancel();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onOk();
    } else if (event.key === 'Escape') {
      this.onCancel();
    }
  }

  reset(): void {
    this.labelText = '';
    this.labelWrap = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.alignment = 'middle';
    this.verticalAlignment = 'middle';
    this.fontSize = 12;
    this.fontWeight = 'bold';
    this.fontFamily = 'Arial, sans-serif';
    this.color = '#333333';
    this.maxWidth = 100;
    this.errorMessage = '';
    this.isVisible = false;
  }

  private clearError(): void {
    this.errorMessage = '';
  }

  showError(message: string): void {
    this.errorMessage = message;
  }

  show(node: GraphNode): void {
    this.node = node;
    this.loadNodeData();
    this.isVisible = true;
    this.errorMessage = '';
    
    // Focus the input after a short delay to ensure the dialog is rendered
    setTimeout(() => {
      const input = document.getElementById('labelText') as HTMLTextAreaElement;
      if (input) {
        input.focus();
        input.select(); // Select the current text for easy editing
      }
    }, 100);
  }
}