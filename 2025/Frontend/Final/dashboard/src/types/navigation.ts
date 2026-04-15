export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Orientation {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Waypoint {
  name: string;
  position: Position;
  orientation: Orientation;
}

export interface PatrolConfig {
  waypoints: Waypoint[];
}

export type NavigationStatus =
  | 'IDLE'
  | 'NAVIGATING'
  | 'REACHED'
  | 'FAILED'
  | 'PAUSED'
  | 'ABORTED'
  | 'REJECTED';

export interface NavigationState {
  status: NavigationStatus;
  currentWaypoint: string | null;
  progress: number;
  error?: string;
}

export interface NavigationUpdate {
  status: string;
  current_waypoint: string;
  waypoint_index: number;
  total_waypoints: number;
}

export interface WaypointReached {
  waypoint_index: number;
  waypoint_name: string;
}

export interface NavigationError {
  error: string;
}
