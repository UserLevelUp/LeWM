import { TestBed } from '@angular/core/testing';
import { ConnectionMode } from './connection.mode';
import { GraphStateService } from '../services/graph-state.service';
import { ConnectionRoutingService } from '../services/connection-routing.service';
import { GraphNode } from '../models/graph-node.model';

describe('ConnectionMode - Routing Integration', () => {
  let connectionMode: ConnectionMode;
  let graphStateService: jasmine.SpyObj<GraphStateService>;
  let routingService: jasmine.SpyObj<ConnectionRoutingService>;

  beforeEach(() => {
    // Create spies for the services
    const graphStateSpy = jasmine.createSpyObj('GraphStateService', [
      'addEdge', 'getPinPosition', 'getNodes', 'getEdges'
    ]);
    const routingSpy = jasmine.createSpyObj('ConnectionRoutingService', ['calculateRoute']);

    TestBed.configureTestingModule({
      providers: [
        { provide: GraphStateService, useValue: graphStateSpy },
        { provide: ConnectionRoutingService, useValue: routingSpy }
      ]
    });

    graphStateService = TestBed.inject(GraphStateService) as jasmine.SpyObj<GraphStateService>;
    routingService = TestBed.inject(ConnectionRoutingService) as jasmine.SpyObj<ConnectionRoutingService>;
    
    // Setup default mock returns
    graphStateService.getEdges.and.returnValue([]);
    
    connectionMode = new ConnectionMode(graphStateService);
    // Manually inject the routing service for testing
    (connectionMode as any).routing = routingService;
    connectionMode.activate();
  });

  describe('connection creation with routing', () => {
    it('should create a direct connection when routing returns 2 points', () => {
      // Setup test data
      const startNode: GraphNode = { 
        id: 'node1', type: 'power', x: 100, y: 100, width: 80, height: 60, label: 'Node 1',
        pins: [{ x: 80, y: 30, name: 'OUT' }]
      };
      const endNode: GraphNode = { 
        id: 'node2', type: 'resistor', x: 300, y: 100, width: 60, height: 20, label: 'Node 2',
        pins: [{ x: 0, y: 10, name: 'IN' }]
      };
      
      const startPin = { x: 80, y: 30, name: 'OUT' };
      const endPin = { x: 0, y: 10, name: 'IN' };
      
      const startPos = { x: 180, y: 130 }; // node1.x + pin.x, node1.y + pin.y
      const endPos = { x: 300, y: 110 };   // node2.x + pin.x, node2.y + pin.y

      // Mock service responses
      graphStateService.getPinPosition.and.returnValues(startPos, endPos);
      graphStateService.getNodes.and.returnValue([startNode, endNode]);
      
      // Return direct route (2 points = no routing needed)
      routingService.calculateRoute.and.returnValue({
        points: [startPos, endPos],
        totalDistance: 120
      });

      // Start connection
      connectionMode.handlePinClick(startNode, startPin, new MouseEvent('click'));
      
      // Complete connection
      connectionMode.handlePinClick(endNode, endPin, new MouseEvent('click'));

      // Verify addEdge was called with correct parameters
      expect(graphStateService.addEdge).toHaveBeenCalledWith(jasmine.objectContaining({
        from: 'node1.OUT',
        to: 'node2.IN',
        direction: 'none', // Should default to 'none' as per requirements
        type: 'signal',
        isRouted: false,
        routedPath: undefined
      }));
    });

    it('should create a routed connection when routing returns multiple points', () => {
      // Setup test data  
      const startNode: GraphNode = { 
        id: 'node1', type: 'power', x: 100, y: 100, width: 80, height: 60, label: 'Node 1',
        pins: [{ x: 80, y: 30, name: 'OUT' }]
      };
      const endNode: GraphNode = { 
        id: 'node2', type: 'resistor', x: 300, y: 200, width: 60, height: 20, label: 'Node 2',
        pins: [{ x: 0, y: 10, name: 'IN' }]
      };
      
      const startPin = { x: 80, y: 30, name: 'OUT' };
      const endPin = { x: 0, y: 10, name: 'IN' };
      
      const startPos = { x: 180, y: 130 };
      const endPos = { x: 300, y: 210 };

      // Mock service responses
      graphStateService.getPinPosition.and.returnValues(startPos, endPos);
      graphStateService.getNodes.and.returnValue([startNode, endNode]);
      
      // Return routed path (multiple points = routing applied)
      const routedPath = [
        startPos,
        { x: 180, y: 80 },  // Route up
        { x: 320, y: 80 },  // Route across
        { x: 320, y: 210 }, // Route down
        endPos
      ];
      
      routingService.calculateRoute.and.returnValue({
        points: routedPath,
        totalDistance: 200
      });

      // Start connection
      connectionMode.handlePinClick(startNode, startPin, new MouseEvent('click'));
      
      // Complete connection
      connectionMode.handlePinClick(endNode, endPin, new MouseEvent('click'));

      // Verify addEdge was called with routed path
      expect(graphStateService.addEdge).toHaveBeenCalledWith(jasmine.objectContaining({
        from: 'node1.OUT',
        to: 'node2.IN',
        direction: 'none', // Should default to 'none'
        type: 'signal',
        isRouted: true,
        routedPath: routedPath
      }));
    });

    it('should use routing service with correct obstacles', () => {
      // Setup test data
      const startNode: GraphNode = { 
        id: 'node1', type: 'power', x: 100, y: 100, width: 80, height: 60, label: 'Node 1',
        pins: [{ x: 80, y: 30, name: 'OUT' }]
      };
      const endNode: GraphNode = { 
        id: 'node2', type: 'resistor', x: 300, y: 100, width: 60, height: 20, label: 'Node 2',  
        pins: [{ x: 0, y: 10, name: 'IN' }]
      };
      const obstacleNode: GraphNode = { 
        id: 'obstacle', type: 'ic', x: 200, y: 90, width: 60, height: 40, label: 'IC',
        pins: []
      };
      
      const startPin = { x: 80, y: 30, name: 'OUT' };
      const endPin = { x: 0, y: 10, name: 'IN' };
      
      const startPos = { x: 180, y: 130 };
      const endPos = { x: 300, y: 110 };

      // Mock service responses
      graphStateService.getPinPosition.and.returnValues(startPos, endPos);
      graphStateService.getNodes.and.returnValue([startNode, endNode, obstacleNode]);
      
      routingService.calculateRoute.and.returnValue({
        points: [startPos, endPos],
        totalDistance: 120
      });

      // Start connection
      connectionMode.handlePinClick(startNode, startPin, new MouseEvent('click'));
      
      // Complete connection  
      connectionMode.handlePinClick(endNode, endPin, new MouseEvent('click'));

      // Verify routing service was called with all nodes as obstacles
      expect(routingService.calculateRoute).toHaveBeenCalledWith(
        startPos,
        endPos, 
        [startNode, endNode, obstacleNode], // All nodes should be considered obstacles
        10 // Default margin
      );
    });

    it('should handle missing pin positions gracefully', () => {
      const startNode: GraphNode = { 
        id: 'node1', type: 'power', x: 100, y: 100, width: 80, height: 60, label: 'Node 1',
        pins: [{ x: 80, y: 30, name: 'OUT' }]
      };
      const endNode: GraphNode = { 
        id: 'node2', type: 'resistor', x: 300, y: 100, width: 60, height: 20, label: 'Node 2',
        pins: [{ x: 0, y: 10, name: 'IN' }]
      };
      
      const startPin = { x: 80, y: 30, name: 'OUT' };
      const endPin = { x: 0, y: 10, name: 'IN' };

      // Mock service to return null positions (missing pins)
      graphStateService.getPinPosition.and.returnValues(null, null);
      graphStateService.getNodes.and.returnValue([startNode, endNode]);

      // Start connection
      connectionMode.handlePinClick(startNode, startPin, new MouseEvent('click'));
      
      // Complete connection
      connectionMode.handlePinClick(endNode, endPin, new MouseEvent('click'));

      // Should still create connection without routing
      expect(graphStateService.addEdge).toHaveBeenCalledWith(jasmine.objectContaining({
        from: 'node1.OUT',
        to: 'node2.IN',
        direction: 'none',
        type: 'signal',
        routedPath: undefined,
        isRouted: false
      }));
      
      // Routing service should not be called when positions are missing
      expect(routingService.calculateRoute).not.toHaveBeenCalled();
    });
  });

  describe('default direction', () => {
    it('should create connections with direction "none" by default', () => {
      const startNode: GraphNode = { 
        id: 'node1', type: 'power', x: 100, y: 100, width: 80, height: 60, label: 'Node 1',
        pins: [{ x: 80, y: 30, name: 'OUT' }]
      };
      const endNode: GraphNode = { 
        id: 'node2', type: 'resistor', x: 300, y: 100, width: 60, height: 20, label: 'Node 2',
        pins: [{ x: 0, y: 10, name: 'IN' }]
      };
      
      const startPin = { x: 80, y: 30, name: 'OUT' };
      const endPin = { x: 0, y: 10, name: 'IN' };

      graphStateService.getPinPosition.and.returnValues(
        { x: 180, y: 130 },
        { x: 300, y: 110 }
      );
      graphStateService.getNodes.and.returnValue([startNode, endNode]);
      
      routingService.calculateRoute.and.returnValue({
        points: [{ x: 180, y: 130 }, { x: 300, y: 110 }],
        totalDistance: 120
      });

      // Create connection
      connectionMode.handlePinClick(startNode, startPin, new MouseEvent('click'));
      connectionMode.handlePinClick(endNode, endPin, new MouseEvent('click'));

      // Verify direction is 'none' as required
      expect(graphStateService.addEdge).toHaveBeenCalledWith(jasmine.objectContaining({
        direction: 'none'
      }));
    });
  });

  describe('mode behavior', () => {
    it('should maintain existing connection mode behavior', () => {
      // Test that existing functionality like escape key handling still works
      expect(connectionMode.name).toBe('connection');
      expect(connectionMode.displayName).toBe('Connection');
      
      // Test activation/deactivation
      connectionMode.activate();
      expect(connectionMode.state.selectedConnections.size).toBe(0);
      expect(connectionMode.state.isCreatingConnection).toBe(false);
      
      connectionMode.deactivate();
      expect(connectionMode.state.selectedConnections.size).toBe(0);
      expect(connectionMode.state.isCreatingConnection).toBe(false);
    });

    it('should handle escape key to exit back to normal mode', () => {
      const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      
      // Should return true to indicate the mode handled the escape
      const handled = connectionMode.handleKeyDown(keyEvent);
      expect(handled).toBe(true);
    });
  });
});