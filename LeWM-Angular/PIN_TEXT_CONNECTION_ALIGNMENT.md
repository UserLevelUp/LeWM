# Pin Text Connection Alignment Feature

## Overview
This feature allows pin text labels to automatically align with connection lines for improved readability. When enabled, the text rotation follows the direction of the connection line rather than using a manually set angle.

## How to Use

### 1. Access Pin Edit Mode
- Launch the LeWM Angular application
- Switch to "Pin Edit" mode from the toolbar
- The application will show pin edit controls

### 2. Select a Connected Pin
- Click on any pin that has connections to other pins
- The Pin Layout Editor will open on the right side
- Navigate to the "Text" properties section

### 3. Enable Connection Following
- Look for the "Follow Connection Line" checkbox
- Check this box to enable automatic text alignment
- The rotation slider will be disabled when this feature is active

### 4. Observe the Behavior
- Pin text will automatically rotate to match the connection direction
- Text points toward the connected pin
- If multiple connections exist, the first connection is used

### 5. Disable When Needed
- Uncheck "Follow Connection Line" to return to manual rotation
- The rotation slider becomes enabled again
- Manual rotation value is preserved

## Technical Details

### Implementation
- Adds `followConnection: boolean` property to `PinTextStyle` interface
- Calculates connection angles using `Math.atan2()` for accurate direction
- Updates both pin-layout-editor and graph-editor rendering
- Falls back gracefully when no connections exist

### Default Connections for Testing
The default graph includes these connections:
- power.+9V → reg.IN
- power.GND → reg.GND
- reg.OUT → amp1.VCC
- mic1.OUT → r1.A
- r1.B → amp1.+IN

### Behavior Rules
1. **Multiple Connections**: Uses the first connection found
2. **No Connections**: Falls back to manual rotation
3. **Dynamic Updates**: Text updates when nodes are moved
4. **Backward Compatibility**: Existing pins default to manual rotation

## Advanced Usage

### Connection Priority
If a pin has multiple connections, the feature uses the first connection returned by the system. This provides predictable behavior while keeping the implementation simple.

### Angle Calculation
- 0 degrees = rightward direction
- Positive angles = clockwise rotation
- Text rotation matches the line from the pin to its connected pin

### Performance
The feature calculates angles on-demand and caches results where possible. Impact on performance is minimal.

## Troubleshooting

### Feature Not Available
- Ensure you're in Pin Edit mode
- Check that the pin has connections
- Verify the pin is properly selected

### Text Not Rotating
- Check that "Follow Connection Line" is enabled
- Verify connections exist for the selected pin
- Ensure nodes are positioned correctly

### Manual Testing
To manually test the feature:
1. Start the application: `npm start`
2. Navigate to http://localhost:4200
3. Follow the usage steps above
4. Test with different connected pins
5. Move nodes to see dynamic updates

## Future Enhancements
Potential improvements for future versions:
- Text offset adjustment along connection direction
- Multi-connection handling options
- Text readability optimization (preventing upside-down text)
- Custom connection priority rules