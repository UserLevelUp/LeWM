import { Injectable } from '@angular/core';
import { GraphNode } from '../models/graph-node.model';

export interface Point {
  x: number;
  y: number;
}

export interface RoutedPath {
  points: Point[];
  totalDistance: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionRoutingService {

  /**
   * Calculate a routed path between two points, avoiding obstacles (nodes)
   * @param start Starting point coordinates
   * @param end Ending point coordinates  
   * @param obstacles Array of nodes to avoid
   * @param margin Minimum margin around obstacles
   * @returns RoutedPath containing the path points and total distance
   */
  calculateRoute(start: Point, end: Point, obstacles: GraphNode[], margin: number = 10): RoutedPath {
    // For minimal changes, implement a simple obstacle avoidance algorithm
    // More sophisticated routing (A*) can be added later if needed
    
    // If there are no obstacles, return direct line
    if (!obstacles || obstacles.length === 0) {
      return {
        points: [start, end],
        totalDistance: this.calculateDistance(start, end)
      };
    }
    
    // Check if direct path is clear
    if (this.isPathClear(start, end, obstacles, margin)) {
      return {
        points: [start, end],
        totalDistance: this.calculateDistance(start, end)
      };
    }
    
    // Find a routed path around obstacles
    const routedPoints = this.findRoutedPath(start, end, obstacles, margin);
    const totalDistance = this.calculatePathDistance(routedPoints);
    
    return {
      points: routedPoints,
      totalDistance
    };
  }

  /**
   * Check if a direct path between two points is clear of obstacles
   */
  private isPathClear(start: Point, end: Point, obstacles: GraphNode[], margin: number): boolean {
    for (const obstacle of obstacles) {
      if (this.lineIntersectsRectangle(start, end, obstacle, margin)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if a line intersects with a rectangle (node + margin)
   */
  private lineIntersectsRectangle(start: Point, end: Point, node: GraphNode, margin: number): boolean {
    const rect = {
      left: node.x - margin,
      top: node.y - margin,
      right: node.x + node.width + margin,
      bottom: node.y + node.height + margin
    };
    
    // Use line-rectangle intersection algorithm
    return this.lineIntersectsRect(start.x, start.y, end.x, end.y, rect);
  }

  /**
   * Line-rectangle intersection using Liang-Barsky algorithm (simplified)
   */
  private lineIntersectsRect(x1: number, y1: number, x2: number, y2: number, rect: any): boolean {
    // Check if either endpoint is inside the rectangle
    if (this.pointInRect(x1, y1, rect) || this.pointInRect(x2, y2, rect)) {
      return true;
    }
    
    // Check intersection with each edge of the rectangle
    return (
      this.lineIntersectsLine(x1, y1, x2, y2, rect.left, rect.top, rect.right, rect.top) ||    // top edge
      this.lineIntersectsLine(x1, y1, x2, y2, rect.right, rect.top, rect.right, rect.bottom) || // right edge
      this.lineIntersectsLine(x1, y1, x2, y2, rect.right, rect.bottom, rect.left, rect.bottom) || // bottom edge
      this.lineIntersectsLine(x1, y1, x2, y2, rect.left, rect.bottom, rect.left, rect.top)     // left edge
    );
  }

  /**
   * Check if point is inside rectangle
   */
  private pointInRect(x: number, y: number, rect: any): boolean {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  /**
   * Check if two line segments intersect
   */
  private lineIntersectsLine(x1: number, y1: number, x2: number, y2: number, 
                            x3: number, y3: number, x4: number, y4: number): boolean {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return false; // Lines are parallel
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    return (t >= 0 && t <= 1 && u >= 0 && u <= 1);
  }

  /**
   * Find a routed path around obstacles using smart waypoint routing
   */
  private findRoutedPath(start: Point, end: Point, obstacles: GraphNode[], margin: number): Point[] {
    // First find which obstacles actually block the direct path
    const blockingObstacles = obstacles.filter(obstacle => 
      this.lineIntersectsRectangle(start, end, obstacle, margin)
    );
    
    if (blockingObstacles.length === 0) {
      return [start, end]; // No obstacles, direct path is fine
    }
    
    // Try simple waypoint routing first
    const simpleRoutes = [
      this.tryHorizontalFirstRouting(start, end, obstacles, margin),
      this.tryVerticalFirstRouting(start, end, obstacles, margin)
    ].filter(route => route.length > 0);
    
    if (simpleRoutes.length > 0) {
      // Return the shortest simple route
      return simpleRoutes.reduce((shortest, current) => 
        this.calculatePathDistance(current) < this.calculatePathDistance(shortest) ? current : shortest
      );
    }
    
    // If simple routing fails, use corner routing around the largest obstacle
    return this.routeAroundLargestObstacle(start, end, blockingObstacles, margin);
  }

  /**
   * Try horizontal-first routing: start → (end.x, start.y) → end
   */
  private tryHorizontalFirstRouting(start: Point, end: Point, obstacles: GraphNode[], margin: number): Point[] {
    const waypoint = { x: end.x, y: start.y };
    
    // If the waypoint is the same as start or end, this routing won't help
    if ((waypoint.x === start.x && waypoint.y === start.y) || 
        (waypoint.x === end.x && waypoint.y === end.y)) {
      return [];
    }
    
    // Check if both segments are clear
    if (this.isPathClear(start, waypoint, obstacles, margin) && 
        this.isPathClear(waypoint, end, obstacles, margin)) {
      return [start, waypoint, end];
    }
    
    return [];
  }

  /**
   * Try vertical-first routing: start → (start.x, end.y) → end
   */
  private tryVerticalFirstRouting(start: Point, end: Point, obstacles: GraphNode[], margin: number): Point[] {
    const waypoint = { x: start.x, y: end.y };
    
    // If the waypoint is the same as start or end, this routing won't help
    if ((waypoint.x === start.x && waypoint.y === start.y) || 
        (waypoint.x === end.x && waypoint.y === end.y)) {
      return [];
    }
    
    // Check if both segments are clear
    if (this.isPathClear(start, waypoint, obstacles, margin) && 
        this.isPathClear(waypoint, end, obstacles, margin)) {
      return [start, waypoint, end];
    }
    
    return [];
  }

  /**
   * Route around the largest obstacle that blocks the direct path
   */
  private routeAroundLargestObstacle(start: Point, end: Point, blockingObstacles: GraphNode[], margin: number): Point[] {
    if (blockingObstacles.length === 0) {
      return [start, end]; // No blocking obstacles
    }
    
    // Find the largest blocking obstacle
    const blockingObstacle = blockingObstacles.reduce((largest, current) => 
      (current.width * current.height) > (largest.width * largest.height) ? current : largest
    );
    
    // Route around the obstacle using corner points
    return this.routeAroundObstacle(start, end, blockingObstacle, margin, blockingObstacles);
  }

  /**
   * Route around a specific obstacle
   */
  private routeAroundObstacle(start: Point, end: Point, obstacle: GraphNode, margin: number, allObstacles: GraphNode[]): Point[] {
    // Calculate the four corner points around the obstacle
    const corners = [
      { x: obstacle.x - margin, y: obstacle.y - margin }, // top-left
      { x: obstacle.x + obstacle.width + margin, y: obstacle.y - margin }, // top-right
      { x: obstacle.x + obstacle.width + margin, y: obstacle.y + obstacle.height + margin }, // bottom-right
      { x: obstacle.x - margin, y: obstacle.y + obstacle.height + margin }  // bottom-left
    ];
    
    // Try routing through each corner and pick the shortest valid path
    let bestPath: Point[] = [];
    let bestDistance = Infinity;
    
    for (const corner of corners) {
      // Check if path segments are clear (only check against other obstacles, not the main one we're routing around)
      const otherObstacles = allObstacles.filter(obs => obs.id !== obstacle.id);
      const path1Clear = this.isPathClear(start, corner, otherObstacles, margin);
      const path2Clear = this.isPathClear(corner, end, otherObstacles, margin);
      
      if (path1Clear && path2Clear) {
        const candidatePath = [start, corner, end];
        const distance = this.calculatePathDistance(candidatePath);
        
        if (distance < bestDistance) {
          bestPath = candidatePath;
          bestDistance = distance;
        }
      }
    }
    
    // If no corner routing works, fall back to direct path (better than no path)
    return bestPath.length > 0 ? bestPath : [start, end];
  }

  /**
   * Calculate the total distance of a path
   */
  private calculatePathDistance(points: Point[]): number {
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += this.calculateDistance(points[i], points[i + 1]);
    }
    return totalDistance;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}