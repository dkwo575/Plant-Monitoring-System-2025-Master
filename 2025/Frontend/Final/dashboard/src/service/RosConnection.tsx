import { useEffect, useState } from 'react';
import ROSLIB from 'roslib';

declare global {
  interface Window {
    ROSLIB: typeof ROSLIB;
  }
}

export const useRosConnection = (rosUrl = 'ws://localhost:9090') => {
  const [ros, setRos] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const rosInstance = new window.ROSLIB.Ros({ url: rosUrl });

    rosInstance.on('connection', () => {
      console.log('Connected to ROS');
      setConnected(true);
    });

    rosInstance.on('error', (error) => {
      console.log('Error connecting to ROS:', error);
      setConnected(false);
    });

    rosInstance.on('close', () => {
      console.log('Connection to ROS closed');
      setConnected(false);
      // Attempt reconnection
      setTimeout(() => {
        rosInstance.connect(rosUrl);
      }, 3000);
    });

    setRos(rosInstance);

    return () => {
      rosInstance.close();
    };
  }, [rosUrl]);

  return { ros, connected };
};
