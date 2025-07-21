# Feature Flag System Setup

## Overview

The LeWM Feature Flag System infrastructure has been successfully scaffolded and is ready for incremental migration of features. This system allows for tier-based and environment-aware feature enabling/disabling based on graph configuration files.

## What's Been Implemented

### 1. Environment Configuration
- **Location**: `src/environments/`
- **Files**: `environment.ts`, `environment.prod.ts`
- **Properties**: 
  - `tier`: Identifies the application version ('public', 'standard', 'pro')
  - `envName`: Identifies the deployment environment ('dev', 'qa', 'prod')

### 2. FeatureGraphService
- **Location**: `src/app/services/feature-graph.service.ts`
- **Key Methods**:
  - `loadFeatures()`: Loads feature graph from JSON file based on environment
  - `isFeatureEnabled(featureName: string)`: Checks if feature is enabled with dependency validation
  - `getEnabledFeatures()`: Returns array of enabled feature names

### 3. Feature Graph Interface
- **Location**: `src/app/interfaces/feature-graph.interface.ts`
- **Structure**: Defines `FeatureGraphNode` and `FeatureGraph` interfaces

### 4. Directory Structure
```
src/assets/features/
├── public/
│   ├── dev.graph.json
│   └── prod.graph.json
```
- Currently contains empty placeholder files `{ "features": [] }`
- Ready for feature definitions as they are migrated

### 5. APP_INITIALIZER Integration
- **Location**: `src/app/app.module.ts`
- **Function**: `initializeFeatures()` factory ensures features are loaded before app startup
- **Dependencies**: HttpClientModule added for JSON loading

### 6. ModeManagerService Preparation
- **Location**: `src/app/services/mode-manager.service.ts`
- **New Method**: `initializeFeatureModes()` placeholder for future mode factory registration
- **Integration**: Injected with FeatureGraphService dependency

### 7. Comprehensive Tests
- **Location**: `src/app/services/feature-graph.service.spec.ts`
- **Coverage**: Tests for loading, error handling, feature enabling, dependency validation, and circular dependency detection

## How to Use

### Checking if a Feature is Enabled

```typescript
// In a component or service
constructor(private featureGraphService: FeatureGraphService) {}

ngOnInit() {
  if (this.featureGraphService.isFeatureEnabled('my-feature')) {
    // Feature is enabled
  }
}
```

### Template Usage

```html
<div *ngIf="featureGraphService.isFeatureEnabled('my-feature')">
  <!-- Feature-specific content -->
</div>
```

## Next Steps for Migration

### Adding a New Feature

1. **Define the feature in the appropriate graph file**:
   ```json
   {
     "features": [
       {
         "id": "unique-id",
         "name": "my-new-feature",
         "enabled": true,
         "dependencies": ["base-feature"] // optional
       }
     ]
   }
   ```

2. **Use the feature flag in your code**:
   ```typescript
   if (this.featureGraphService.isFeatureEnabled('my-new-feature')) {
     // Feature logic
   }
   ```

3. **For mode-based features**, register the mode factory in `ModeManagerService.initializeFeatureModes()`

### Creating Different Tiers

1. **Create new tier directory**: `src/assets/features/pro/`
2. **Add environment files**: `dev.graph.json`, `qa.graph.json`, `prod.graph.json`
3. **Update environment.ts**: Set `tier: 'pro'` for the appropriate build configuration

### Migrating Existing Features

1. **Identify the feature/mode to migrate**
2. **Add feature definition to relevant graph files**
3. **Wrap existing feature code with feature flag checks**
4. **Test with feature enabled/disabled**
5. **Update mode registration if applicable**

## System Benefits

- **Gradual Migration**: Features can be migrated incrementally without disrupting existing functionality
- **Environment Control**: Different features can be enabled per environment (dev/qa/prod)
- **Tier Support**: Public vs. private builds can have different feature sets
- **Dependency Management**: Features can depend on other features
- **Error Resilience**: System gracefully handles missing graph files
- **Performance**: Features are loaded once at app startup

## Architecture Notes

- **Public/Private Separation**: Ready for private initializer files for pro features
- **Mode Factory Pattern**: ModeManagerService prepared for dynamic mode registration
- **Circular Dependency Protection**: Built-in detection prevents infinite loops
- **Validation**: Recursive dependency checking ensures all requirements are met

The infrastructure is now ready for incremental feature migration as described in the original feature flag system design.

## Appendix: Feature Flag Configuration Mode

### Overview

The Feature Flag Configuration Mode will transform the feature flag system into a visual, interactive graph interface where users can:
- View all available features as a node graph
- See feature dependencies as connections
- Toggle features on/off
- Save custom feature configurations
- Understand tier limitations

### Key Binding & Navigation

- **Primary Key**: `F1` - Traditional help/information key, perfect for feature documentation
- **Alternative**: `Shift+F` - "**F**eature Flags" mnemonic
- **Button Name**: "Feature Flags" or "Features"
- **Route**: `/features` or `/feature-flags`

### Visual Representation

Each feature flag becomes a graph node with:
- **Node Color Coding**:
  - Green: Enabled and all dependencies met
  - Red: Disabled
  - Yellow: Partially enabled (missing dependencies)
  - Blue: Premium feature (requires tier upgrade)
  - Gray: Unavailable in current environment
  
- **Node Structure**:
  - Icon: Feature type indicator (mode, UI element, capability)
  - Title: Feature display name
  - Badge: Tier indicator (Free/Standard/Pro)
  
- **Pins & Connections**:
  - Input pins: Required dependencies
  - Output pins: Dependent features
  - Connection color: Dependency health status

### Feature Flag Mode Interface

```typescript
export interface FeatureFlagMode extends GraphMode {
  name: 'feature-flag';
  displayName: 'Feature Flags';
  
  // Transform feature graph to visual nodes
  loadFeatureGraph(): void;
  
  // Handle feature toggling
  toggleFeature(featureId: string): void;
  
  // Save/load configurations
  savePreset(name: string): void;
  loadPreset(presetId: string): void;
}
```

### Left Panel Content Structure

```typescript
interface FeatureFlagPanelContent {
  sections: [
    {
      title: 'Quick Actions',
      actions: [
        'Enable All Compatible',
        'Reset to Defaults',
        'Save Configuration'
      ]
    },
    {
      title: 'Active Features',
      features: FeatureInfo[],
      showCount: true
    },
    {
      title: 'Available Features',
      groupBy: 'category', // or 'tier'
      features: FeatureInfo[]
    },
    {
      title: 'Saved Configurations',
      presets: FeaturePreset[]
    },
    {
      title: 'Feature Details',
      // Shows selected feature documentation
      content: FeatureDocumentation
    }
  ]
}
```

### Feature Presets System

```typescript
export interface FeaturePreset {
  id: string;
  name: string;
  description: string;
  enabledFeatures: string[];
  tier: 'free' | 'standard' | 'pro';
  isUserCreated: boolean;
  createdAt: Date;
  tags: string[]; // e.g., ['minimal', 'circuit-design', 'development']
}

// Built-in presets:
const DEFAULT_PRESETS = [
  {
    name: "Minimal",
    description: "Basic node editing only",
    tags: ['simple', 'beginner']
  },
  {
    name: "Circuit Designer",
    description: "Optimized for circuit design workflow",
    tags: ['circuits', 'engineering']
  },
  {
    name: "Developer Mode",
    description: "All development and debugging features",
    tags: ['development', 'advanced']
  }
];
```

### Feature Documentation Integration

```typescript
export interface FeatureDocumentation {
  featureId: string;
  summary: string;
  description: string;
  examples?: string[];
  shortcuts?: KeyboardShortcut[];
  relatedFeatures?: string[];
  tutorialUrl?: string;
}
```

### Implementation Strategy

1. **Feature Flag Mode as Core Feature**
   - Always available regardless of tier
   - Read-only view of premium features in free tier
   - Full editing capabilities based on user's tier

2. **Tier-Aware Feature Replacement**
   ```typescript
   // Premium features can replace free versions
   {
     "id": "pin-edit-mode-pro",
     "name": "pin-edit-mode",
     "replaces": "pin-edit-mode",
     "tier": "pro",
     "enabled": true
   }
   ```

3. **Feature Dependency Visualization**
   - Use D3.js or similar for interactive graph
   - Animate enable/disable propagation through dependencies
   - Highlight circular dependencies in red
   - Show tier upgrade paths

4. **Help System Integration**
   - F1 in any mode shows context-aware feature help
   - F1 in Feature Flag Mode shows comprehensive system overview
   - Inline tooltips explain each feature's purpose
   - "What's New" section for recently added features

5. **Configuration Persistence**
   ```typescript
   // Save to localStorage for free tier
   // Save to cloud for pro tier
   interface FeatureConfiguration {
     version: string;
     lastModified: Date;
     enabledFeatures: string[];
     customPresets: FeaturePreset[];
   }
   ```

### User Experience Flow

1. **First Time Users**:
   - F1 opens feature overview with guided tour
   - Suggests appropriate preset based on user goals
   - Highlights free vs. premium features

2. **Power Users**:
   - Quick toggle frequently used features
   - Save multiple configurations for different workflows
   - Export/import configurations

3. **Developers**:
   - See feature IDs and technical names
   - Test feature combinations
   - Validate dependency chains

### Benefits

- **Self-Documenting**: System explains itself through visual representation
- **Discoverable**: Users can explore available features naturally
- **Flexible**: Save configurations for different use cases
- **Educational**: Learn about features and their relationships
- **Upgradeable**: Clear path to premium features

This Feature Flag Configuration Mode transforms feature management from a hidden system configuration into a first-class user experience, perfectly aligned with LeWM's graph-centric philosophy.