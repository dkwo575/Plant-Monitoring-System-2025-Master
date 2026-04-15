// declare global {
//   interface Window {
//     ROSLIB: {
//       Ros: new (options: { url: string }) => RosInstance;
//       Topic: new (options: TopicOptions) => TopicInstance;
//       Message: new (values: any) => any;
//       Service: new (options: ServiceOptions) => ServiceInstance;
//       Param: new (options: ParamOptions) => ParamInstance;
//     };
//     // New line of code for ROS2D - can be deleted if not works
//     ROS2D: {
//       Viewer: new (options: ViererOptions) => ViewerInstance;
//       OccupancyGridClient: new (options: OccupancyGridClientOptions) => OccupancyGridClientInstance;
//     };
//   }
// }

// // New interfaces for ROS2D - can be deleted if not works
// export interface ViewerOptions {
//   divID: string;
//   width: number;
//   height: number;
//   background?: string;
// }

// export interface ViewerInstance {
//   scene: any; // EaselJS stage
//   scaleToDimensions(width: number, height: number): void;
//   shift(x: number, y: number): void;
// }

// export interface GridClientOptions {
//   ros: any; // RosInstance
//   rootObject: any; // The viewer.scene
//   continuous?: boolean; // Use true for SLAM (live updates), false for static map
// }

// export interface GridClientInstance {
//   on(event: string, callback: () => void): void;
// }

// // Existing interfaces for ROSLIB

// export interface RosInstance {
//   connect(url: string): void;
//   close(): void;
//   on(event: 'connection' | 'error' | 'close', callback: (error?: any) => void): void;
//   getTopics(callback: (topics: string[]) => void, errback?: (error: any) => void): void;
// }

// export interface TopicOptions {
//   ros: RosInstance;
//   name: string;
//   messageType: string;
//   throttle_rate?: number;
// }

// export interface TopicInstance {
//   subscribe(callback: (message: any) => void): void;
//   unsubscribe(): void;
//   publish(message: any): void;
//   advertise(): void;
//   unadvertise(): void;
// }

// export interface ServiceOptions {
//   ros: RosInstance;
//   name: string;
//   serviceType: string;
// }

// export interface ServiceInstance {
//   callService(
//     request: any,
//     callback: (response: any) => void,
//     errback?: (error: any) => void,
//   ): void;
// }

// export interface ParamOptions {
//   ros: RosInstance;
//   name: string;
// }

// export interface ParamInstance {
//   get(callback: (value: any) => void): void;
//   set(value: any, callback?: () => void): void;
// }

// export interface Vector3 {
//   x: number;
//   y: number;
//   z: number;
// }

// export interface Twist {
//   linear: Vector3;
//   angular: Vector3;
// }

// export {};

export interface RosInstance {
  connect: (url: string) => void;
  close: () => void;
  on: (event: string, callback: (data?: any) => void) => void;
  off: (event: string, callback: (data?: any) => void) => void;
  isConnected: () => boolean;
  socket?: {
    url: string;
    readyState: number;
  };
}

declare global {
  interface Window {
    ROSLIB: {
      Ros: new (options: { url: string }) => RosInstance;
      Topic: any;
      Service: any;
      Param: any;
      Message: any;
    };
    ROS2D: {
      Viewer: any;
      OccupancyGridClient: any;
    };
  }
}

export {};
// ```

// ## After adding the scripts:

// 1. **Restart your dev server** (important!)
// 2. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
// 3. Go back to the Diagnostics tab

// You should now see:
// ```
// ROSLIB Loaded: Yes ✅
// ROS Object Exists: Yes ✅
// ```

// And if rosbridge is running on the robot, you'll see:
// ```
// Connected (prop): Yes ✅
// ROS isConnected(): Yes ✅
// WebSocket State: OPEN
