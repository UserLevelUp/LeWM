export interface NodeLabelStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | 'lighter' | 'bolder';
  color: string;
  alignment: 'start' | 'middle' | 'end'; // text-anchor values
  verticalAlignment: 'top' | 'middle' | 'bottom';
  wrap: boolean; // whether to wrap long text
  maxWidth?: number; // max width for wrapping
}

export interface NodeLabelPosition {
  offsetX: number; // X offset from node center
  offsetY: number; // Y offset from node center
}

export interface GraphNode {
  id: string; // Unique identifier for the node
  type: string; // Generic type (e.g., 'basic', 'complex', 'circuit-resistor')
  x: number; // X-coordinate on the canvas
  y: number; // Y-coordinate on the canvas
  width: number; // Width of the node
  height: number; // Height of the node
  label: string; // Display label for the node
  value?: string; // Optional value (can be number, string, symbols, etc.)
  unit?: string; // Optional unit string representation
  pins?: Pin[]; // Optional connection points for domain-specific nodes
  labelPosition?: NodeLabelPosition; // Optional label positioning
  labelStyle?: NodeLabelStyle; // Optional label styling
}

export interface Pin {
  x: number;
  y: number;
  name: string;
}

