import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-node-name-dialog',
  standalone: false,
  template: `
    <div class="node-dialog-overlay" *ngIf="isVisible" (click)="onOverlayClick($event)">
      <div class="node-dialog" (click)="$event.stopPropagation()">
        <div class="node-dialog-header">
          <h4>Edit Node Properties</h4>
        </div>
        <div class="node-dialog-body">
          <div class="form-group">
            <label for="nodeName">Node Name:</label>
            <input 
              #nodeInput
              type="text" 
              id="nodeName" 
              [(ngModel)]="nodeName" 
              (keydown)="onKeyDown($event)"
              placeholder="Enter node name..."
              class="node-input"
              [class.error]="errorMessage">
          </div>
          
          <div class="form-group">
            <label for="nodeValue">Value (optional):</label>
            <input 
              type="text" 
              id="nodeValue" 
              [(ngModel)]="nodeValue" 
              (keydown)="onKeyDown($event)"
              placeholder="Enter value (number, string, symbols...)..."
              class="node-input">
          </div>
          
          <div class="form-group">
            <label for="nodeUnit">Unit (optional):</label>
            <input 
              type="text" 
              id="nodeUnit" 
              [(ngModel)]="nodeUnit" 
              (keydown)="onKeyDown($event)"
              placeholder="Enter unit (V, A, Ω, m/s, etc.)..."
              class="node-input">
          </div>
          
          <div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
        </div>
        <div class="node-dialog-footer">
          <button type="button" class="btn btn-cancel" (click)="onCancel()">Cancel</button>
          <button type="button" class="btn btn-ok" (click)="onOk()" [disabled]="!nodeName.trim()">OK</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .node-dialog-overlay {
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

    .node-dialog {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 400px;
    }

    .node-dialog-header {
      padding: 1rem 1.5rem 0.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .node-dialog-header h4 {
      margin: 0;
      color: #333;
      font-size: 1.1rem;
    }

    .node-dialog-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group:last-of-type {
      margin-bottom: 0;
    }

    .node-dialog-body label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #555;
    }

    .node-input {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e9ecef;
      border-radius: 4px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .node-input:focus {
      outline: none;
      border-color: #007bff;
    }

    .node-input.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    .node-dialog-footer {
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
export class NodeNameDialogComponent implements OnChanges {
  @Input() isVisible = false;
  @Input() currentName: string = '';
  @Input() currentValue: string = '';
  @Input() currentUnit: string = '';
  @Output() propertiesChanged = new EventEmitter<{name: string, value: string, unit: string}>();
  @Output() cancelled = new EventEmitter<void>();

  nodeName = '';
  nodeValue = '';
  nodeUnit = '';
  errorMessage = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentName'] && changes['currentName'].currentValue !== undefined) {
      this.nodeName = this.currentName;
    }
    if (changes['currentValue'] && changes['currentValue'].currentValue !== undefined) {
      this.nodeValue = this.currentValue;
    }
    if (changes['currentUnit'] && changes['currentUnit'].currentValue !== undefined) {
      this.nodeUnit = this.currentUnit;
    }
    // If the dialog is visible, focus the input when any current value changes
    if (this.isVisible && (changes['currentName'] || changes['currentValue'] || changes['currentUnit'])) {
      this.focusInput();
    }
  }

  onOk(): void {
    if (this.nodeName.trim()) {
      this.clearError(); // Clear any previous error
      this.propertiesChanged.emit({
        name: this.nodeName.trim(),
        value: this.nodeValue.trim(),
        unit: this.nodeUnit.trim()
      });
      // Note: Don't reset here if there's a validation error
      // The parent component will handle whether to close the dialog
    }
  }

  onCancel(): void {
    this.cancelled.emit();
    this.reset();
  }

  onOverlayClick(event: MouseEvent): void {
    this.onCancel();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onOk();
    } else if (event.key === 'Escape') {
      this.onCancel();
    }
  }

  reset(): void {
    this.nodeName = '';
    this.nodeValue = '';
    this.nodeUnit = '';
    this.errorMessage = '';
    this.isVisible = false;
  }

  private clearError(): void {
    this.errorMessage = '';
  }

  showError(message: string): void {
    this.errorMessage = message;
  }

  show(currentName: string, currentValue: string = '', currentUnit: string = ''): void {
    this.currentName = currentName;
    this.currentValue = currentValue;
    this.currentUnit = currentUnit;
    this.nodeName = currentName;
    this.nodeValue = currentValue;
    this.nodeUnit = currentUnit;
    this.isVisible = true;
    this.errorMessage = '';
    
    this.focusInput();
  }

  private focusInput(): void {
    // Focus the input after a short delay to ensure the dialog is rendered
    setTimeout(() => {
      const input = document.getElementById('nodeName') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select(); // Select the current text for easy editing
      }
    }, 100);
  }
}