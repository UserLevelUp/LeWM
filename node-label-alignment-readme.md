# Node Label Alignment Analysis & Implementation Guide

## Current State Analysis

### Overview
LeWM (Level With Me) is a visual graph editor with two implementations:
- **React Prototype** (legacy): Basic circuit editor with hardcoded label positioning
- **Angular Implementation** (main): Sophisticated graph editor with configurable pin alignment but fixed node label alignment

### Current Node Label Alignment System

#### Angular Implementation
The Angular app (`LeWM-Angular/src/app/components/graph-editor/`) currently implements node label alignment as follows:

**Location**: `graph-editor.component.html` lines 207-213
```html
<text [attr.x]="node.x + node.width/2" 
      [attr.y]="node.y + node.height/2 + 5" 
      text-anchor="middle" 
      font-size="12" 
      font-weight="bold">
  {{ node.label }}
</text>
```

**Current Behavior**:
- **Horizontal**: Center-aligned (`text-anchor="middle"`, x-position at `node.width/2`)
- **Vertical**: Center-aligned with 5px downward offset (`node.height/2 + 5`)
- **Fixed**: No configuration options available
- **Font**: 12px, bold, no custom styling

#### React Prototype
The React prototype uses similar center-alignment but with different implementations per component type:
- Power components: Multiple text elements for multi-line labels
- IC components: Single centered label
- Other components: Hardcoded center positioning

### Identified Alignment Issues

#### High Priority Issues (Probability of Fix: 85-95%)
1. **Long Label Overflow**: Labels longer than node width extend beyond boundaries
   - **Impact**: Visual clutter, overlapping with other nodes
   - **Fix Probability**: 95% - Easy to implement with CSS `text-overflow` or text wrapping

2. **Multi-line Label Support**: No support for line breaks in labels
   - **Impact**: Limited expressiveness for complex node descriptions
   - **Fix Probability**: 85% - Requires SVG `<tspan>` implementation

3. **Inconsistent Pin vs Node Alignment**: Pins have configurable alignment, nodes don't
   - **Impact**: User experience inconsistency
   - **Fix Probability**: 90% - Can reuse existing pin alignment system

#### Medium Priority Issues (Probability of Fix: 60-75%)
4. **Dynamic Font Sizing**: Fixed 12px font doesn't scale with node size
   - **Impact**: Poor readability on very large or small nodes
   - **Fix Probability**: 75% - Requires calculation logic for optimal font size

5. **Vertical Alignment Options**: Only center+offset available
   - **Impact**: Limited layout flexibility
   - **Fix Probability**: 70% - Needs UI controls and preference storage

6. **Text Style Consistency**: Node labels lack styling options available to pins
   - **Impact**: Limited visual customization
   - **Fix Probability**: 65% - Would need to extend GraphNode interface

#### Lower Priority Issues (Probability of Fix: 30-50%)
7. **Internationalization**: No RTL text support or font family options
   - **Impact**: Limited global usability
   - **Fix Probability**: 40% - Requires significant i18n infrastructure

8. **Accessibility**: No ARIA labels or high contrast options
   - **Impact**: Poor accessibility compliance
   - **Fix Probability**: 35% - Needs comprehensive accessibility audit

## Technical Implementation Details

### Current Text Positioning Logic
```typescript
// Current positioning (simplified)
const labelX = node.x + (node.width / 2);  // Horizontal center
const labelY = node.y + (node.height / 2) + 5;  // Vertical center + offset
```

### Pin Label System (Advanced Reference)
Pins already have sophisticated alignment via `calculatePinTextPosition()`:
```typescript
calculatePinTextPosition(pin: Pin, node: GraphNode): { x: number; y: number } {
  const pinPos = this.calculatePinPosition(pin, node);
  return {
    x: pinPos.x + pin.textStyle.offset.x,
    y: pinPos.y + pin.textStyle.offset.y
  };
}
```

Pin text styling includes:
- `pin.textStyle.alignment` (start, middle, end)
- `pin.textStyle.fontFamily`
- `pin.textStyle.fontSize`
- `pin.textStyle.fontWeight`
- `pin.textStyle.offset` (x, y offsets)

## Recommended Implementation Approach

### Phase 1: Enhanced Node Label Interface (High Priority)
Extend the `GraphNode` interface to support label configuration:

```typescript
// Extend models/graph-node.model.ts
export interface GraphNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  value?: string;
  unit?: string;
  pins?: Pin[];
  
  // New label configuration
  labelStyle?: {
    alignment: {
      horizontal: 'start' | 'middle' | 'end';
      vertical: 'top' | 'middle' | 'bottom';
    };
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    offset: { x: number; y: number };
    maxWidth?: number;
    wordWrap?: boolean;
  };
}
```

### Phase 2: Dynamic Label Positioning Function
Create a reusable label positioning service:

```typescript
// services/label-positioning.service.ts
calculateNodeLabelPosition(node: GraphNode): {
  x: number;
  y: number;
  textAnchor: string;
  dominantBaseline: string;
} {
  const style = node.labelStyle || DEFAULT_LABEL_STYLE;
  
  // Horizontal positioning
  let x: number;
  let textAnchor: string;
  switch (style.alignment.horizontal) {
    case 'start':
      x = node.x + style.offset.x;
      textAnchor = 'start';
      break;
    case 'end':
      x = node.x + node.width + style.offset.x;
      textAnchor = 'end';
      break;
    default: // 'middle'
      x = node.x + (node.width / 2) + style.offset.x;
      textAnchor = 'middle';
  }
  
  // Vertical positioning
  let y: number;
  let dominantBaseline: string;
  switch (style.alignment.vertical) {
    case 'top':
      y = node.y + style.offset.y;
      dominantBaseline = 'hanging';
      break;
    case 'bottom':
      y = node.y + node.height + style.offset.y;
      dominantBaseline = 'baseline';
      break;
    default: // 'middle'
      y = node.y + (node.height / 2) + style.offset.y;
      dominantBaseline = 'central';
  }
  
  return { x, y, textAnchor, dominantBaseline };
}
```

### Phase 3: Template Implementation
Update the graph editor template:

```html
<!-- Enhanced node label rendering -->
<text *ngFor="let node of nodes$ | async"
      [attr.x]="getLabelPosition(node).x"
      [attr.y]="getLabelPosition(node).y"
      [attr.text-anchor]="getLabelPosition(node).textAnchor"
      [attr.dominant-baseline]="getLabelPosition(node).dominantBaseline"
      [attr.font-family]="node.labelStyle?.fontFamily || 'sans-serif'"
      [attr.font-size]="node.labelStyle?.fontSize || 12"
      [attr.font-weight]="node.labelStyle?.fontWeight || 'bold'"
      [attr.fill]="selectedNodes.has(node.id) ? '#ffffff' : '#333333'">
  {{ node.label }}
</text>
```

## Feature Flag Implementation

### Recommended Feature Flag Structure
Add to the existing feature flag system (`services/feature-graph.service.ts`):

```typescript
// Add to feature configuration
'node-label-alignment': {
  name: 'Enhanced Node Label Alignment',
  description: 'Enables configurable alignment options for node labels',
  defaultEnabled: false,
  dependencies: [],
  tier: 'standard',
  environments: ['dev', 'qa', 'prod']
}
```

### Feature Flag Usage
Implement progressive enhancement:

```html
<!-- Basic labels (always available) -->
<text *ngIf="!(isFeatureEnabled('node-label-alignment') | async)"
      [attr.x]="node.x + node.width/2" 
      [attr.y]="node.y + node.height/2 + 5" 
      text-anchor="middle" 
      font-size="12" 
      font-weight="bold">
  {{ node.label }}
</text>

<!-- Enhanced labels (feature flag enabled) -->
<text *ngIf="isFeatureEnabled('node-label-alignment') | async"
      [attr.x]="getLabelPosition(node).x"
      [attr.y]="getLabelPosition(node).y"
      [attr.text-anchor]="getLabelPosition(node).textAnchor"
      [attr.dominant-baseline]="getLabelPosition(node).dominantBaseline"
      [attr.font-family]="node.labelStyle?.fontFamily || 'sans-serif'"
      [attr.font-size]="node.labelStyle?.fontSize || 12"
      [attr.font-weight]="node.labelStyle?.fontWeight || 'bold'">
  {{ node.label }}
</text>
```

### User Interface Controls
Add alignment controls to the node editor dialog:

```html
<!-- In NodeNameDialogComponent or new NodePropertiesDialogComponent -->
<div class="label-alignment-controls" *ngIf="isFeatureEnabled('node-label-alignment') | async">
  <h4>Label Alignment</h4>
  
  <div class="alignment-grid">
    <label>Horizontal:</label>
    <select [(ngModel)]="nodeData.labelStyle.alignment.horizontal">
      <option value="start">Left</option>
      <option value="middle">Center</option>
      <option value="end">Right</option>
    </select>
    
    <label>Vertical:</label>
    <select [(ngModel)]="nodeData.labelStyle.alignment.vertical">
      <option value="top">Top</option>
      <option value="middle">Center</option>
      <option value="bottom">Bottom</option>
    </select>
  </div>
  
  <div class="font-controls">
    <label>Font Size:</label>
    <input type="number" [(ngModel)]="nodeData.labelStyle.fontSize" min="8" max="24">
    
    <label>Font Weight:</label>
    <select [(ngModel)]="nodeData.labelStyle.fontWeight">
      <option value="normal">Normal</option>
      <option value="bold">Bold</option>
    </select>
  </div>
</div>
```

## Testing Strategy

### Unit Tests
```typescript
// graph-editor.component.spec.ts
describe('Node Label Positioning', () => {
  it('should center-align labels by default', () => {
    const node = createTestNode();
    const position = component.getLabelPosition(node);
    expect(position.textAnchor).toBe('middle');
    expect(position.x).toBe(node.x + node.width / 2);
  });
  
  it('should respect custom alignment settings', () => {
    const node = createTestNode({
      labelStyle: {
        alignment: { horizontal: 'start', vertical: 'top' }
      }
    });
    const position = component.getLabelPosition(node);
    expect(position.textAnchor).toBe('start');
    expect(position.dominantBaseline).toBe('hanging');
  });
});
```

### Integration Tests
- Visual regression tests for different alignment combinations
- Test label overflow handling
- Test feature flag enable/disable scenarios

## Migration Strategy

### Backwards Compatibility
1. **Default Behavior**: Existing nodes continue using center alignment
2. **Gradual Migration**: Feature flag allows opt-in to new system
3. **Data Migration**: Add migration script to populate labelStyle defaults

### Rollout Plan
1. **Phase 1**: Implement basic alignment options (horizontal + vertical)
2. **Phase 2**: Add font styling controls
3. **Phase 3**: Implement advanced features (text wrapping, overflow handling)
4. **Phase 4**: Enable by default after testing period

## Performance Considerations

### Optimization Strategies
1. **Memoization**: Cache label position calculations
2. **Virtual Rendering**: Only calculate positions for visible nodes
3. **Debounced Updates**: Batch position recalculations during drag operations

### Memory Impact
- **Minimal**: New labelStyle properties add ~100 bytes per node
- **Acceptable**: For typical graphs with <1000 nodes, impact is negligible

## Conclusion

The current node label alignment system is functional but limited. Implementing configurable alignment would significantly improve user experience and maintain consistency with the existing pin alignment system. The recommended approach provides a clear upgrade path while maintaining backwards compatibility through feature flags.

**Estimated Implementation Effort**: 2-3 weeks for full implementation
**Risk Level**: Low (leverages existing patterns and infrastructure)
**User Impact**: High (addresses common layout frustrations)

The feature flag approach allows for safe deployment and gradual adoption, making this a low-risk, high-value enhancement to the LeWM system.