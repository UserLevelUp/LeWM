# LeWM Angular Routing Guide

## Overview

LeWM Angular implements routing for different application modes, providing a structured navigation system for the graph editor interface.

## Current Routes

### Normal Node Mode

- **Route Path**: `/nodes`
- **Component**: `GraphEditorComponent`
- **Description**: The primary route for normal node mode editing

This route activates when working with nodes in the standard editing mode. It provides access to:
- Node library with available components (9V Battery, Resistor, Capacitor, LED, Switch, IC Chip, Generic Node)
- Mode switching controls (Normal, Pin Edit, Connection, File modes)
- Feature flag controls
- Graph canvas for node manipulation

### Default Route

- **Route Path**: `/` (root)
- **Redirect**: Automatically redirects to `/nodes`
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
  { path: '', redirectTo: '/nodes', pathMatch: 'full' },
  { path: 'nodes', component: GraphEditorComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
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

Users can navigate directly to the nodes view:
```
http://localhost:4200/nodes
```

### Automatic Redirect

Accessing the root URL automatically redirects to the nodes view:
```
http://localhost:4200/  →  http://localhost:4200/nodes
```

## Future Routing Extensions

The current routing structure provides a foundation for additional modes:

- Pin editing modes with dedicated routes
- Connection-specific views
- Layout and arrangement modes
- File management interfaces

Additional routes can be added to the `routes` array in `app-routing-module.ts` as new modes are developed.

## Technical Notes

### Standalone Components

The application uses Angular's standalone component architecture with `bootstrapApplication()`. The routing module is imported through the `AppModule` providers configuration.

### Route Configuration

- **Path Matching**: Uses full path matching for the root redirect to ensure precise navigation behavior
- **Component Loading**: The `GraphEditorComponent` is loaded dynamically through the router, not directly imported in the main app component
- **State Preservation**: Routing preserves all existing application state and functionality

## Testing

The routing can be verified by:

1. **Build Testing**: `npm run build` confirms routing configuration is valid
2. **Development Server**: `ng serve` allows manual verification of route navigation
3. **URL Navigation**: Direct URL access to `/nodes` and automatic redirect from `/` work correctly
4. **Functionality Testing**: All existing graph editor features remain functional under the new routing structure

This routing implementation successfully addresses the requirement to "Add routing for normal Node Mode" while maintaining all existing functionality and providing a foundation for future enhancements.