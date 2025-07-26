import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NodeLabelBatchEditDialogComponent, NodeLabelBatchEditResult } from './node-label-batch-edit-dialog.component';
import { GraphNode } from '../../models/graph-node.model';

describe('NodeLabelBatchEditDialogComponent', () => {
  let component: NodeLabelBatchEditDialogComponent;
  let fixture: ComponentFixture<NodeLabelBatchEditDialogComponent>;
  let testNodes: GraphNode[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, NodeLabelBatchEditDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(NodeLabelBatchEditDialogComponent);
    component = fixture.componentInstance;
    
    testNodes = [
      {
        id: 'node1',
        type: 'basic',
        x: 100,
        y: 100,
        width: 80,
        height: 60,
        label: 'Node 1'
      },
      {
        id: 'node2',
        type: 'basic',
        x: 200,
        y: 100,
        width: 80,
        height: 60,
        label: 'Node 2'
      }
    ];
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize node data when shown', () => {
    component.show(testNodes);
    
    expect(component.nodeDataList.length).toBe(2);
    expect(component.nodeDataList[0].node.id).toBe('node1');
    expect(component.nodeDataList[0].label).toBe('Node 1');
    expect(component.nodeDataList[1].node.id).toBe('node2');
    expect(component.nodeDataList[1].label).toBe('Node 2');
    expect(component.isVisible).toBe(true);
  });

  it('should track nodes by ID', () => {
    const nodeData = { node: testNodes[0], label: 'Test' };
    const trackId = component.trackByNodeId(0, nodeData);
    expect(trackId).toBe('node1');
  });

  it('should emit changes when OK is clicked with position applied', () => {
    spyOn(component.labelChanges, 'emit');
    
    component.show(testNodes);
    component.applyPosition = true;
    component.globalOffsetX = 10;
    component.globalOffsetY = -5;
    
    component.onOk();

    expect(component.labelChanges.emit).toHaveBeenCalledWith([
      {
        nodeId: 'node1',
        labelPosition: { offsetX: 10, offsetY: -5 }
      },
      {
        nodeId: 'node2',
        labelPosition: { offsetX: 10, offsetY: -5 }
      }
    ] as NodeLabelBatchEditResult[]);
  });

  it('should emit changes when OK is clicked with style applied', () => {
    spyOn(component.labelChanges, 'emit');
    
    component.show(testNodes);
    component.applyStyle = true;
    component.globalFontSize = 16;
    component.globalColor = '#ff0000';
    component.globalAlignment = 'start';
    
    component.onOk();

    expect(component.labelChanges.emit).toHaveBeenCalledWith([
      {
        nodeId: 'node1',
        labelStyle: {
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          color: '#ff0000',
          alignment: 'start',
          verticalAlignment: 'middle',
          wrap: false,
          maxWidth: undefined
        }
      },
      {
        nodeId: 'node2',
        labelStyle: {
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          color: '#ff0000',
          alignment: 'start',
          verticalAlignment: 'middle',
          wrap: false,
          maxWidth: undefined
        }
      }
    ] as NodeLabelBatchEditResult[]);
  });

  it('should emit changes for modified labels only', () => {
    spyOn(component.labelChanges, 'emit');
    
    component.show(testNodes);
    component.nodeDataList[0].label = 'Modified Node 1';
    // nodeDataList[1] remains unchanged
    
    component.onOk();

    expect(component.labelChanges.emit).toHaveBeenCalledWith([
      {
        nodeId: 'node1',
        label: 'Modified Node 1'
      }
    ] as NodeLabelBatchEditResult[]);
  });

  it('should emit alignment only when applyAlignment is true but applyStyle is false', () => {
    spyOn(component.labelChanges, 'emit');
    
    component.show(testNodes);
    component.applyAlignment = true;
    component.globalAlignment = 'end';
    component.globalVerticalAlignment = 'top';
    // applyStyle remains false
    
    component.onOk();

    expect(component.labelChanges.emit).toHaveBeenCalledWith([
      {
        nodeId: 'node1',
        labelStyle: {
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          color: '#333333',
          alignment: 'end',
          verticalAlignment: 'top',
          wrap: false
        }
      },
      {
        nodeId: 'node2',
        labelStyle: {
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 'bold',
          color: '#333333',
          alignment: 'end',
          verticalAlignment: 'top',
          wrap: false
        }
      }
    ] as NodeLabelBatchEditResult[]);
  });

  it('should emit cancelled when cancel is clicked', () => {
    spyOn(component.cancelled, 'emit');
    
    component.onCancel();

    expect(component.cancelled.emit).toHaveBeenCalled();
    expect(component.isVisible).toBe(false);
  });

  it('should reset all values when reset is clicked', () => {
    component.show(testNodes);
    component.applyPosition = true;
    component.applyStyle = true;
    component.globalOffsetX = 20;
    component.globalFontSize = 18;
    component.nodeDataList[0].label = 'Modified';
    
    component.onReset();

    expect(component.applyPosition).toBe(false);
    expect(component.applyStyle).toBe(false);
    expect(component.globalOffsetX).toBe(0);
    expect(component.globalFontSize).toBe(12);
    expect(component.nodeDataList[0].label).toBe('Node 1'); // Reset to original
  });

  it('should not emit changes when no modifications are made', () => {
    spyOn(component.labelChanges, 'emit');
    
    component.show(testNodes);
    // No modifications made
    
    component.onOk();

    expect(component.labelChanges.emit).toHaveBeenCalledWith([]);
  });
});