import { TestBed } from '@angular/core/testing';
import { ConnectionRoutingService, Point } from './connection-routing.service';
import { GraphNode } from '../models/graph-node.model';

describe('ConnectionRoutingService', () => {
  let service: ConnectionRoutingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConnectionRoutingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateRoute', () => {
    it('should return direct path when no obstacles exist', () => {
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 100, y: 100 };
      const obstacles: GraphNode[] = [];
      
      const route = service.calculateRoute(start, end, obstacles);
      
      expect(route.points).toEqual([start, end]);
      expect(route.points.length).toBe(2);
    });

    it('should return direct path when path is clear of obstacles', () => {
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 100, y: 100 };
      // Place obstacle far away from the path
      const obstacles: GraphNode[] = [{
        id: 'node1',
        type: 'test',
        x: 200,
        y: 200,
        width: 50,
        height: 50,
        label: 'Test Node'
      }];
      
      const route = service.calculateRoute(start, end, obstacles);
      
      expect(route.points).toEqual([start, end]);
      expect(route.points.length).toBe(2);
    });

    it('should create routed path when obstacle blocks direct line', () => {
      const start: Point = { x: 0, y: 50 };
      const end: Point = { x: 100, y: 50 };
      // Place obstacle directly in the path - covers y:25-75, x:40-60  
      // The direct line at y=50 should intersect with this rectangle
      const obstacles: GraphNode[] = [{
        id: 'blocking-node',
        type: 'test',
        x: 40,
        y: 25,
        width: 20,
        height: 50,
        label: 'Blocking Node'
      }];
      
      const route = service.calculateRoute(start, end, obstacles, 5);
      
      // Debug logging for test
      console.log('Test route result:', route);
      console.log('Route points:', route.points);
      console.log('Points count:', route.points.length);
      
      // Should have more than 2 points for a routed path
      expect(route.points.length).toBeGreaterThan(2);
      // Should start and end at the correct points
      expect(route.points[0]).toEqual(start);
      expect(route.points[route.points.length - 1]).toEqual(end);
    });

    it('should calculate correct total distance for direct path', () => {
      const start: Point = { x: 0, y: 0 };
      const end: Point = { x: 3, y: 4 }; // 3-4-5 triangle, distance = 5
      const obstacles: GraphNode[] = [];
      
      const route = service.calculateRoute(start, end, obstacles);
      
      expect(route.totalDistance).toBe(5);
    });

    it('should handle multiple obstacles by finding best route', () => {
      const start: Point = { x: 0, y: 50 };
      const end: Point = { x: 200, y: 50 };
      // Place multiple obstacles
      const obstacles: GraphNode[] = [
        {
          id: 'obstacle1',
          type: 'test',
          x: 50,
          y: 25,
          width: 30,
          height: 50,
          label: 'Obstacle 1'
        },
        {
          id: 'obstacle2',
          type: 'test',
          x: 120,
          y: 25,
          width: 30,
          height: 50,
          label: 'Obstacle 2'
        }
      ];
      
      const route = service.calculateRoute(start, end, obstacles, 5);
      
      // Should create a valid routed path
      expect(route.points.length).toBeGreaterThanOrEqual(2);
      expect(route.points[0]).toEqual(start);
      expect(route.points[route.points.length - 1]).toEqual(end);
      expect(route.totalDistance).toBeGreaterThan(0);
    });

    it('should respect margin parameter around obstacles', () => {
      const start: Point = { x: 0, y: 25 };
      const end: Point = { x: 100, y: 25 };
      const obstacles: GraphNode[] = [{
        id: 'node1',
        type: 'test',
        x: 40,
        y: 0,
        width: 20,
        height: 50,
        label: 'Test Node'
      }];
      
      // With no margin, might go directly (depends on exact positioning)
      const routeNoMargin = service.calculateRoute(start, end, obstacles, 0);
      
      // With large margin, should definitely route around
      const routeWithMargin = service.calculateRoute(start, end, obstacles, 20);
      
      // The routed path with margin should avoid the obstacle more clearly
      expect(routeWithMargin.points.length).toBeGreaterThanOrEqual(routeNoMargin.points.length);
    });

    it('should handle edge case with start and end at same position', () => {
      const start: Point = { x: 50, y: 50 };
      const end: Point = { x: 50, y: 50 };
      const obstacles: GraphNode[] = [];
      
      const route = service.calculateRoute(start, end, obstacles);
      
      expect(route.points).toEqual([start, end]);
      expect(route.totalDistance).toBe(0);
    });
  });

  describe('connection mode routing integration', () => {
    it('should provide routed paths for connection creation', () => {
      // This is an integration test to ensure the service works with connection mode
      const pinA: Point = { x: 80, y: 50 }; // Right side of first node
      const pinB: Point = { x: 20, y: 150 }; // Left side of second node
      
      // Simulate two nodes that would block a direct connection
      const nodes: GraphNode[] = [
        {
          id: 'nodeA',
          type: 'power',
          x: 50,
          y: 25,
          width: 80,
          height: 50,
          label: 'Node A'
        },
        {
          id: 'nodeB',
          type: 'resistor',
          x: 0,
          y: 125,
          width: 60,
          height: 50,
          label: 'Node B'
        }
      ];
      
      const route = service.calculateRoute(pinA, pinB, nodes, 10);
      
      // Should successfully create a route
      expect(route.points.length).toBeGreaterThanOrEqual(2);
      expect(route.totalDistance).toBeGreaterThan(0);
      
      // Verify start and end points
      expect(route.points[0]).toEqual(pinA);
      expect(route.points[route.points.length - 1]).toEqual(pinB);
    });
  });
});