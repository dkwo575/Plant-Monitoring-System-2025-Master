import { useEffect, useState, useRef } from 'react';
import type { RosInstance } from '../types/roslib';

interface UseRosConnectionReturn {
  ros: RosInstance | null;
  connected: boolean;
  error: string | null;
}

export const useRosConnection = (
  rosUrl: string = 'ws://localhost:9090',
): UseRosConnectionReturn => {
  const [ros, setRos] = useState<RosInstance | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!window.ROSLIB) {
      setError('ROSLIB not loaded. Please check if the script is included.');
      return;
    }

    const rosInstance = new window.ROSLIB.Ros({ url: rosUrl });

    rosInstance.on('connection', () => {
      console.log('Connected to ROS');
      setConnected(true);
      setError(null);
    });

    rosInstance.on('error', (errorEvent: any) => {
      console.error('Error connecting to ROS:', errorEvent);
      setConnected(false);
      setError(`Connection error: ${errorEvent?.message || 'Unknown error'}`);
    });

    rosInstance.on('close', () => {
      console.log('Connection to ROS closed');
      setConnected(false);

      // Attempt reconnection after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Attempting to reconnect...');
        rosInstance.connect(rosUrl);
      }, 3000);
    });

    setRos(rosInstance);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      rosInstance.close();
    };
  }, [rosUrl]);

  return { ros, connected, error };
};
