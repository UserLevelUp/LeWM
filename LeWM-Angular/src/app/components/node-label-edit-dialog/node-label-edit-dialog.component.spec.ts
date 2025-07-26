import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NodeLabelEditDialogComponent, NodeLabelEditResult } from './node-label-edit-dialog.component';
import { GraphNode } from '../../models/graph-node.model';

describe('NodeLabelEditDialogComponent', () => {
  let component: NodeLabelEditDialogComponent;
  let fixture: ComponentFixture<NodeLabelEditDialogComponent>;
  let testNode: GraphNode;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, NodeLabelEditDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NodeLabelEditDialogComponent);
    component = fixture.componentInstance;
    
    testNode = {
      id: 'test-node',
      type: 'basic',
      x: 100,
      y: 100,
      width: 80,
      height: 60,
      label: 'Test Node'
    };
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load node data when shown', () => {
    component.show(testNode);
    
    expect(component.labelText).toBe('Test Node');
    expect(component.offsetX).toBe(0);
    expect(component.offsetY).toBe(0);
    expect(component.alignment).toBe('middle');
    expect(component.verticalAlignment).toBe('middle');
    expect(component.fontSize).toBe(12);
    expect(component.fontWeight).toBe('bold');
    expect(component.fontFamily).toBe('Arial, sans-serif');
    expect(component.color).toBe('#333333');
    expect(component.labelWrap).toBe(false);
    expect(component.isVisible).toBe(true);
  });

  it('should load custom label style from node', () => {
    const nodeWithStyle: GraphNode = {
      ...testNode,
      labelStyle: {
        fontSize: 16,
        fontFamily: 'Helvetica, sans-serif',
        fontWeight: 'normal',
        color: '#ff0000',
        alignment: 'start',
        verticalAlignment: 'top',
        wrap: true,
        maxWidth: 150
      }
    };

    component.show(nodeWithStyle);

    expect(component.fontSize).toBe(16);
    expect(component.fontFamily).toBe('Helvetica, sans-serif');
    expect(component.fontWeight).toBe('normal');
    expect(component.color).toBe('#ff0000');
    expect(component.alignment).toBe('start');
    expect(component.verticalAlignment).toBe('top');
    expect(component.labelWrap).toBe(true);
    expect(component.maxWidth).toBe(150);
  });

  it('should load custom label position from node', () => {
    const nodeWithPosition: GraphNode = {
      ...testNode,
      labelPosition: {
        offsetX: 10,
        offsetY: -5
      }
    };

    component.show(nodeWithPosition);

    expect(component.offsetX).toBe(10);
    expect(component.offsetY).toBe(-5);
  });

  it('should emit labelChanged when OK is clicked', () => {
    spyOn(component.labelChanged, 'emit');
    
    component.show(testNode);
    component.labelText = 'Updated Label';
    component.offsetX = 5;
    component.offsetY = -10;
    component.alignment = 'end';
    component.fontSize = 14;
    component.color = '#0000ff';
    
    component.onOk();

    expect(component.labelChanged.emit).toHaveBeenCalledWith({
      label: 'Updated Label',
      labelPosition: { offsetX: 5, offsetY: -10 },
      labelStyle: {
        fontSize: 14,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        color: '#0000ff',
        alignment: 'end',
        verticalAlignment: 'middle',
        wrap: false,
        maxWidth: undefined
      }
    } as NodeLabelEditResult);
  });

  it('should not emit when label text is empty', () => {
    spyOn(component.labelChanged, 'emit');
    
    component.show(testNode);
    component.labelText = '';
    
    component.onOk();

    expect(component.labelChanged.emit).not.toHaveBeenCalled();
  });

  it('should emit cancelled when cancel is clicked', () => {
    spyOn(component.cancelled, 'emit');
    
    component.onCancel();

    expect(component.cancelled.emit).toHaveBeenCalled();
    expect(component.isVisible).toBe(false);
  });

  it('should reset to defaults when reset is clicked', () => {
    component.show(testNode);
    component.labelText = 'Modified';
    component.offsetX = 20;
    component.fontSize = 18;
    component.labelWrap = true;
    
    component.onReset();

    expect(component.labelText).toBe('');
    expect(component.offsetX).toBe(0);
    expect(component.offsetY).toBe(0);
    expect(component.fontSize).toBe(12);
    expect(component.labelWrap).toBe(false);
  });

  it('should handle keyboard events', () => {
    spyOn(component, 'onOk');
    spyOn(component, 'onCancel');
    
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    
    component.onKeyDown(enterEvent);
    expect(component.onOk).toHaveBeenCalled();
    
    component.onKeyDown(escapeEvent);
    expect(component.onCancel).toHaveBeenCalled();
  });
});