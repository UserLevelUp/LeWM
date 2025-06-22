import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Pin, PinModeState, PinSubMode, PinPosition, PinTextStyle, PinStyle, DEFAULT_PIN_TEXT_STYLE, DEFAULT_PIN_STYLE } from '../interfaces/pin.interface';

@Injectable({
  providedIn: 'root'
})
export class PinStateService {
  private pinsSubject = new BehaviorSubject<Map<string, Pin>>(new Map());
  private modeStateSubject = new BehaviorSubject<PinModeState>({
    subMode: 'layout',
    selectedPins: [],
    isMultiSelect: false,
    gridSnap: true,
    showGuides: true
  });
  private layoutEditorVisibleSubject = new BehaviorSubject<boolean>(false);
  private pinModeActiveSubject = new BehaviorSubject<boolean>(false);

  public pins$ = this.pinsSubject.asObservable();
  public modeState$ = this.modeStateSubject.asObservable();
  public layoutEditorVisible$ = this.layoutEditorVisibleSubject.asObservable();
  public pinModeActive$ = this.pinModeActiveSubject.asObservable();

  public selectedPins$: Observable<Pin[]> = combineLatest([
    this.pins$,
    this.modeState$
  ]).pipe(
    map(([pins, state]) => {
      return state.selectedPins.map(id => pins.get(id)).filter(Boolean) as Pin[];
    })
  );

  addPin(nodeId: string, position: PinPosition, label: string = ''): string {
    const id = `pin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pin: Pin = {
      id,
      nodeId,
      label,
      position,
      textStyle: { ...DEFAULT_PIN_TEXT_STYLE },
      pinStyle: { ...DEFAULT_PIN_STYLE },
      isInput: true,
      isOutput: true,
      pinType: 'input',
      pinNumber: '',
      signalName: '',
      pinSize: 4,
      pinColor: '#000000',
      showPinNumber: false
    };

    const currentPins = this.pinsSubject.value;
    const newPins = new Map(currentPins);
    newPins.set(id, pin);
    this.pinsSubject.next(newPins);

    return id;
  }

  updatePin(pinId: string, updates: Partial<Pin>): void {
    const currentPins = this.pinsSubject.value;
    const pin = currentPins.get(pinId);
    
    if (pin) {
      const newPins = new Map(currentPins);
      newPins.set(pinId, { ...pin, ...updates });
      this.pinsSubject.next(newPins);
      console.log(`Updated pin ${pinId} with:`, updates);
    }
  }

  updatePinPosition(pinId: string, position: PinPosition): void {
    this.updatePin(pinId, { position });
  }

  updatePinTextStyle(pinId: string, textStyle: Partial<PinTextStyle>): void {
    const currentPins = this.pinsSubject.value;
    const pin = currentPins.get(pinId);
    
    if (pin) {
      const newPins = new Map(currentPins);
      newPins.set(pinId, {
        ...pin,
        textStyle: { ...pin.textStyle, ...textStyle }
      });
      this.pinsSubject.next(newPins);
    }
  }

  updatePinStyle(pinId: string, pinStyle: Partial<PinStyle>): void {
    const currentPins = this.pinsSubject.value;
    const pin = currentPins.get(pinId);
    
    if (pin) {
      const newPins = new Map(currentPins);
      newPins.set(pinId, {
        ...pin,
        pinStyle: { ...pin.pinStyle, ...pinStyle }
      });
      this.pinsSubject.next(newPins);
    }
  }

  selectPin(pinId: string, multiSelect: boolean = false): void {
    console.log('selectPin called with:', pinId, 'multiSelect:', multiSelect);
    console.log('Current pins in store:', Array.from(this.pinsSubject.value.keys()));
    
    // Check if the pin exists in our store
    const pinExists = this.pinsSubject.value.has(pinId);
    console.log('Pin exists in store:', pinExists);
    
    if (!pinExists) {
      console.warn('Pin not found in PinStateService store. Pin ID:', pinId);
      // Don't select a pin that doesn't exist in our store
      return;
    }

    const currentState = this.modeStateSubject.value;
    
    if (multiSelect) {
      const isSelected = currentState.selectedPins.includes(pinId);
      const selectedPins = isSelected 
        ? currentState.selectedPins.filter(id => id !== pinId)
        : [...currentState.selectedPins, pinId];
      
      this.modeStateSubject.next({
        ...currentState,
        selectedPins,
        isMultiSelect: true
      });
      
      // Update pin selection state
      this.updatePinSelectionState(selectedPins);
    } else {
      this.modeStateSubject.next({
        ...currentState,
        selectedPins: [pinId],
        isMultiSelect: false
      });
      
      // Update pin selection state
      this.updatePinSelectionState([pinId]);
    }
  }
  
  private updatePinSelectionState(selectedPinIds: string[]): void {
    const currentPins = this.pinsSubject.value;
    const newPins = new Map(currentPins);
    
    // Clear all selections first
    newPins.forEach((pin, id) => {
      if (pin.isSelected) {
        newPins.set(id, { ...pin, isSelected: false });
      }
    });
    
    // Set selected pins
    selectedPinIds.forEach(pinId => {
      const pin = newPins.get(pinId);
      if (pin) {
        newPins.set(pinId, { ...pin, isSelected: true });
      }
    });
    
    this.pinsSubject.next(newPins);
  }

  importPin(pin: Pin): void {
    console.log('Importing pin to PinStateService:', pin.id);
    const currentPins = this.pinsSubject.value;
    const newPins = new Map(currentPins);
    newPins.set(pin.id, pin);
    this.pinsSubject.next(newPins);
  }

  importPins(pins: Pin[]): void {
    console.log('Importing multiple pins to PinStateService:', pins.length);
    const currentPins = this.pinsSubject.value;
    const newPins = new Map(currentPins);
    
    pins.forEach(pin => {
      newPins.set(pin.id, pin);
    });
    
    this.pinsSubject.next(newPins);
  }

  debugPins(): void {
    console.log('PinStateService debug info:');
    console.log('Total pins:', this.pinsSubject.value.size);
    console.log('Pin IDs:', Array.from(this.pinsSubject.value.keys()));
    console.log('Selected pin IDs:', this.modeStateSubject.value.selectedPins);
  }

  clearSelection(): void {
    const currentState = this.modeStateSubject.value;
    this.modeStateSubject.next({
      ...currentState,
      selectedPins: [],
      isMultiSelect: false
    });
    
    // Clear pin selection state
    this.updatePinSelectionState([]);
  }

  setSubMode(subMode: PinSubMode): void {
    const currentState = this.modeStateSubject.value;
    this.modeStateSubject.next({
      ...currentState,
      subMode
    });
  }
  
  toggleGridSnap(): void {
    const currentState = this.modeStateSubject.value;
    this.modeStateSubject.next({
      ...currentState,
      gridSnap: !currentState.gridSnap
    });
  }
  
  setGridSnap(enabled: boolean): void {
    const currentState = this.modeStateSubject.value;
    this.modeStateSubject.next({
      ...currentState,
      gridSnap: enabled
    });
  }

  deletePin(pinId: string): void {
    const currentPins = this.pinsSubject.value;
    const newPins = new Map(currentPins);
    newPins.delete(pinId);
    this.pinsSubject.next(newPins);
    
    const currentState = this.modeStateSubject.value;
    this.modeStateSubject.next({
      ...currentState,
      selectedPins: currentState.selectedPins.filter(id => id !== pinId)
    });
  }

  getPinsForNode(nodeId: string): Observable<Pin[]> {
    return this.pins$.pipe(
      map(pins => Array.from(pins.values()).filter(pin => pin.nodeId === nodeId))
    );
  }

  openLayoutEditor(): void {
    const selectedPinIds = this.modeStateSubject.value.selectedPins;
    console.log('Opening layout editor with selected pin IDs:', selectedPinIds);
    
    if (selectedPinIds.length > 0) {
      const selectedPins = this.getSelectedPins();
      console.log('Retrieved selected pins for editor:', selectedPins.length, selectedPins.map(p => ({ id: p.id, label: p.label })));
      this.layoutEditorVisibleSubject.next(true);
    } else {
      console.warn('No pins selected when trying to open layout editor');
    }
  }

  closeLayoutEditor(): void {
    console.log('Closing pin layout editor');
    this.layoutEditorVisibleSubject.next(false);
  }

  setPinModeActive(active: boolean): void {
    console.log('Setting pin mode active:', active);
    this.pinModeActiveSubject.next(active);
  }

  batchUpdatePins(updates: { pinId: string; changes: Partial<Pin> }[]): void {
    const currentPins = this.pinsSubject.value;
    const newPins = new Map(currentPins);
    
    updates.forEach(({ pinId, changes }) => {
      const pin = newPins.get(pinId);
      if (pin) {
        newPins.set(pinId, { ...pin, ...changes });
      }
    });
    
    this.pinsSubject.next(newPins);
  }

  handleKeyboard(event: KeyboardEvent): boolean {
    const currentState = this.modeStateSubject.value;
    const isActive = this.pinModeActiveSubject.value;
    
    console.log('PinStateService handleKeyboard:', {
      key: event.key,
      selectedPins: currentState.selectedPins.length,
      pinModeActive: isActive,
      target: (event.target as Element)?.tagName,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey
    });
    
    if (!isActive) {
      console.log('Pin mode not active, ignoring keyboard event');
      return false;
    }
    
    if (event.key === 'Enter' && currentState.selectedPins.length > 0) {
      console.log('Opening layout editor - Enter key pressed with', currentState.selectedPins.length, 'selected pins');
      this.openLayoutEditor();
      return true;
    }
    
    if (event.key === 'Escape') {
      if (currentState.selectedPins.length > 0) {
        console.log('Clearing selection - Escape key pressed');
        this.clearSelection();
        return true;
      }
    }
    
    console.log('No action taken for key:', event.key);
    return false;
  }

  getSelectedPins(): Pin[] {
    const selectedPinIds = this.modeStateSubject.value.selectedPins;
    const currentPins = this.pinsSubject.value;
    
    console.log('Getting selected pins:', {
      selectedPinIds,
      totalPins: currentPins.size,
      availablePinIds: Array.from(currentPins.keys())
    });
    
    const result = selectedPinIds
      .map(id => currentPins.get(id))
      .filter(Boolean) as Pin[];
    
    console.log('Returning selected pins:', result.length, result.map(p => ({ id: p.id, label: p.label })));
    return result;
  }

  /**
   * Validates that pin data is consistent between PinStateService and legacy system
   * @param graphStateService Reference to GraphStateService for validation
   */
  validatePinConsistency(graphStateService: any): { inconsistencies: string[]; isValid: boolean } {
    const inconsistencies: string[] = [];
    const currentPins = this.pinsSubject.value;
    const nodes = graphStateService.getNodes();
    
    console.log('🔍 Validating pin consistency between systems...');
    
    // Check each pin in PinStateService against legacy system
    Array.from(currentPins.values()).forEach(pin => {
      const [nodeId, pinName] = pin.id.split('.');
      const node = nodes.find((n: any) => n.id === nodeId);
      
      if (node && node.pins) {
        const legacyPin = node.pins.find((p: any) => p.name === pinName);
        if (legacyPin) {
          // Check position consistency
          if (legacyPin.x !== pin.position.x || legacyPin.y !== pin.position.y) {
            const msg = `Position mismatch for ${pin.id}: PinState(${pin.position.x},${pin.position.y}) vs Legacy(${legacyPin.x},${legacyPin.y})`;
            inconsistencies.push(msg);
            console.warn(`⚠️ ${msg}`);
          }
        } else {
          const msg = `Pin ${pin.id} exists in PinStateService but not in legacy system`;
          inconsistencies.push(msg);
          console.warn(`⚠️ ${msg}`);
        }
      } else {
        const msg = `Node ${nodeId} not found in legacy system for pin ${pin.id}`;
        inconsistencies.push(msg);
        console.warn(`⚠️ ${msg}`);
      }
    });
    
    const isValid = inconsistencies.length === 0;
    console.log(`🔍 Pin consistency validation: ${isValid ? '✅ VALID' : `❌ ${inconsistencies.length} issues found`}`);
    
    return { inconsistencies, isValid };
  }
}
