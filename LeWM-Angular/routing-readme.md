# LeWM Angular Routing Guide

## Overview

LeWM Angular implements routing for different application modes, providing a structured navigation system for the graph editor interface. Each route corresponds to a specific editing mode and provides users with different interaction capabilities.

## Current Routes

### Normal Node Mode

- **Route Path**: `/node` (primary), `/nodes` (legacy compatibility)
- **Component**: `GraphEditorComponent`
- **Data**: `{ mode: 'normal' }`
- **Description**: The primary route for normal node mode editing

This route activates when working with nodes in the standard editing mode. It provides access to:
- Node library with available components (9V Battery, Resistor, Capacitor, LED, Switch, IC Chip, Generic Node)
- Mode switching controls (Normal, Pin Edit, Connection, File modes)
- Feature flag controls
- Graph canvas for node manipulation

### Pin Edit Mode

- **Route Path**: `/pin`
- **Component**: `GraphEditorComponent` 
- **Data**: `{ mode: 'pin-edit' }`
- **Description**: Dedicated route for pin editing functionality

This route enables pin-specific editing capabilities including:
- Individual pin manipulation
- Pin property configuration
- Connection point management
- Enhanced pin visualization

### Connection Mode

- **Route Path**: `/connection`
- **Component**: `GraphEditorComponent`
- **Data**: `{ mode: 'connection' }`
- **Description**: Specialized route for connection creation and editing with intelligent routing

This route provides advanced connection functionality including:
- Intelligent pathfinding and obstacle avoidance
- Visual connection routing around components
- Multi-segment connection paths
- Automated route optimization

### Default Route

- **Route Path**: `/` (root)
- **Redirect**: Automatically redirects to `/node`
- **Match Strategy**: Full path match

The root path automatically redirects users to the normal node mode, ensuring a consistent entry point into the application.

## Routing Architecture

### Core Implementation

The routing is implemented in `src/app/app-routing-module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GraphEditorComponent } from './components/graph-editor/graph-editor.component';

const routes: Routes = [
  { path: '', redirectTo: '/node', pathMatch: 'full' },
  { path: 'node', component: GraphEditorComponent, data: { mode: 'normal' } },
  { path: 'nodes', component: GraphEditorComponent, data: { mode: 'normal' } }, // Backward compatibility
  { path: 'pin', component: GraphEditorComponent, data: { mode: 'pin-edit' } },
  { path: 'connection', component: GraphEditorComponent, data: { mode: 'connection' } }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```

### Mode Data Integration

Each route includes a `data` property that specifies the mode:
- **`{ mode: 'normal' }`**: Activates normal node editing mode
- **`{ mode: 'pin-edit' }`**: Activates pin editing mode  
- **`{ mode: 'connection' }`**: Activates connection creation mode

### Component Mode Switching

The `GraphEditorComponent` handles mode switching through the `switchMode()` method:

```typescript
switchMode(modeName: string): void {
  this.modeManager.activateMode(modeName);
  // Clear selection when entering normal mode
  if (modeName === 'normal') {
    this.selectedNodes.clear();
  }
  
  // Navigate to appropriate URL based on mode
  if (!this.isNavigatingFromRoute) {
    switch (modeName) {
      case 'normal':
        this.router.navigate(['/node']);
        break;
      case 'pin-edit':
        this.router.navigate(['/pin']);
        break;
      case 'connection':
        this.router.navigate(['/connection']);
        break;
    }
  }
}
```

### Template Integration

The main application template (`src/app/app.component.html`) uses `<router-outlet />` to dynamically load routed components:

```html
<main class="main-content">
  <router-outlet />
</main>
```

## Design Principles

### Core Feature

This routing implementation is a **core application feature**, not controlled by the feature flag system. The routing functionality is always available regardless of feature flag configurations, as it represents fundamental navigation capabilities.

### Normal Mode Focus

The current routing structure centers around the "normal node mode" where:
- Nodes are the primary selection objects
- Users interact with the graph editor in its standard configuration
- All basic graph editing functionality is available

## Usage Examples

### Direct Navigation

Users can navigate directly to any mode:
```
http://localhost:4200/node       # Normal node mode
http://localhost:4200/pin        # Pin edit mode  
http://localhost:4200/connection # Connection mode
```

### Automatic Redirect

Accessing the root URL automatically redirects to normal mode:
```
http://localhost:4200/  →  http://localhost:4200/node
```

### Programmatic Navigation

Components can programmatically switch modes and routes:
```typescript
// Switch to connection mode
this.router.navigate(['/connection']);

// Switch to pin edit mode  
this.router.navigate(['/pin']);

// Return to normal mode
this.router.navigate(['/node']);
```

## Adding New Routes - Step by Step Guide

This section documents the process used to add the connection route and provides a template for adding future routes.

### Connection Route Implementation Process

The connection route was added following these specific steps:

#### Step 1: Define the Route in app-routing-module.ts

Add the new route to the `routes` array in `src/app/app-routing-module.ts`:

```typescript
const routes: Routes = [
  // ... existing routes ...
  { path: 'connection', component: GraphEditorComponent, data: { mode: 'connection' } }
];
```

**Key Elements:**
- **path**: URL segment (e.g., 'connection' for `/connection`)
- **component**: Should be `GraphEditorComponent` for mode-based routes
- **data**: Must include `{ mode: 'mode-name' }` to specify the mode

#### Step 2: Update switchMode() Method

Add the routing case to the `switchMode()` method in `src/app/components/graph-editor/graph-editor.component.ts`:

```typescript
switchMode(modeName: string): void {
  this.modeManager.activateMode(modeName);
  // Clear selection when entering normal mode
  if (modeName === 'normal') {
    this.selectedNodes.clear();
  }
  
  // Navigate to appropriate URL based on mode
  if (!this.isNavigatingFromRoute) {
    switch (modeName) {
      case 'normal':
        this.router.navigate(['/node']);
        break;
      case 'pin-edit':
        this.router.navigate(['/pin']);
        break;
      case 'connection':  // ← NEW CASE ADDED HERE
        this.router.navigate(['/connection']);
        break;
      // Add future modes here
    }
  }
}
```

#### Step 3: Add UI Button (if needed)

If the mode requires a dedicated UI button, add it to the toolbar template:

```html
<button
  class="btn btn-secondary"
  [class.active]="currentMode === 'connection'"
  (click)="switchMode('connection')"
  title="Connection Mode (C)">
  Connection (C)
</button>
```

#### Step 4: Add Keyboard Shortcut (if needed)

Register the keyboard shortcut in the component's event handling:

```typescript
@HostListener('document:keydown', ['$event'])
handleKeyboardEvent(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return;
  }
  
  switch (event.key.toLowerCase()) {
    case 'c':
      this.switchMode('connection');
      event.preventDefault();
      break;
    // ... other shortcuts ...
  }
}
```

### Template for Adding New Routes

Follow this template when adding any new route:

#### 1. Route Definition Template
```typescript
// In src/app/app-routing-module.ts
{ path: 'your-route-name', component: GraphEditorComponent, data: { mode: 'your-mode-name' } }
```

#### 2. Component Integration Template
```typescript
// In src/app/components/graph-editor/graph-editor.component.ts
case 'your-mode-name':
  this.router.navigate(['/your-route-name']);
  break;
```

#### 3. UI Button Template (if applicable)
```html
<button
  class="btn btn-secondary"
  [class.active]="currentMode === 'your-mode-name'"
  (click)="switchMode('your-mode-name')"
  title="Your Mode Name (Key)">
  Your Mode (Key)
</button>
```

#### 4. Keyboard Shortcut Template (if applicable)
```typescript
case 'your-key':
  this.switchMode('your-mode-name');
  event.preventDefault();
  break;
```

### Required Files for Route Changes

When adding a new route, you will typically modify these files:

1. **`src/app/app-routing-module.ts`** - Add route definition
2. **`src/app/components/graph-editor/graph-editor.component.ts`** - Add switchMode case and keyboard handling
3. **`src/app/components/graph-editor/graph-editor.component.html`** - Add UI button (if needed)
4. **Mode-specific files** - Create or update the mode implementation (e.g., `src/app/modes/your-mode.ts`)

### Testing New Routes

After implementing a new route, verify:

1. **Direct URL Navigation**: `http://localhost:4200/your-route-name` loads correctly
2. **Button Click Navigation**: UI button switches to correct route
3. **Keyboard Shortcut**: Key combination switches to correct route  
4. **Mode Activation**: Correct mode is activated when route loads
5. **Backward Compatibility**: Existing routes still work
6. **Tests Pass**: `npm run test` passes all tests
7. **Lint Clean**: `npm run lint` passes without errors
8. **Build Success**: `npm run build` completes successfully

### Route Naming Conventions

- **URL Path**: Use lowercase, hyphen-separated names (e.g., 'pin-edit', 'connection')
- **Mode Name**: Use lowercase, hyphen-separated names matching the path where possible
- **Data Consistency**: Ensure `data.mode` matches the mode name used in `switchMode()`
- **Backward Compatibility**: Keep existing routes for compatibility when introducing new primary routes

## Technical Notes

### Standalone Components

The application uses Angular's standalone component architecture with `bootstrapApplication()`. The routing module is imported through the `AppModule` providers configuration.

### Route Configuration

- **Path Matching**: Uses full path matching for the root redirect to ensure precise navigation behavior
- **Component Loading**: The `GraphEditorComponent` is loaded dynamically through the router, not directly imported in the main app component
- **State Preservation**: Routing preserves all existing application state and functionality

## Testing

The routing can be verified by:

1. **Lint Check**: `npm run lint` - Ensures code quality and style compliance
2. **Unit Tests**: `npm run test` - Runs all component and service tests (currently 117 tests)
3. **Build Verification**: `npm run build` - Confirms routing configuration compiles correctly
4. **Development Server**: `ng serve` - Allows manual verification of route navigation
5. **URL Navigation**: Direct URL access to all routes (`/node`, `/pin`, `/connection`) works correctly
6. **Mode Integration**: Route changes properly activate corresponding modes
7. **Functionality Testing**: All existing graph editor features remain functional under the routing structure

### Current Test Coverage

- **117 tests passing** - Full test suite including routing integration
- **Connection routing tests** - 16+ tests covering pathfinding algorithms and integration
- **Mode switching tests** - Keyboard shortcuts and programmatic mode changes
- **UI integration tests** - Button interactions and route navigation

This routing implementation successfully provides a structured navigation system while maintaining all existing functionality and providing a robust foundation for future enhancements.