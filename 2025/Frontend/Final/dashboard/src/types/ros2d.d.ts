declare global {
  interface Window {
    ROS2D: {
      Viewer: any;
      OccupancyGridClient: any;
    };
  }
}

export {};
