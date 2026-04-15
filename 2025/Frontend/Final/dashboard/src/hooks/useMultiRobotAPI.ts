import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';

const API_BASE_URL = 'http://localhost:5000/api';

export interface Robot {
  robot_id: string;
  robot_ip: string;
  connected: boolean;
  state?: {
    battery: { percentage: number; voltage: number; current: number };
    odometry: { x: number; y: number; theta: number };
    velocity: { linear: number; angular: number };
    mode: string;
    patrol_active: boolean;
  };
}

interface UseMultiRobotAPIReturn {
  robots: Robot[];
  loading: boolean;
  error: string | null;
  addRobot: (robotId: string, robotIp: string) => Promise<boolean>;
  removeRobot: (robotId: string) => Promise<boolean>;
  connectRobot: (robotId: string) => Promise<boolean>;
  disconnectRobot: (robotId: string) => Promise<boolean>;
  moveRobot: (robotId: string, linear: number, angular: number) => Promise<boolean>;
  stopRobot: (robotId: string) => Promise<boolean>;
  sendGoal: (robotId: string, position: any, orientation: any) => Promise<boolean>;
  cancelGoal: (robotId: string) => Promise<boolean>;
  getRobotStatus: (robotId: string) => Promise<Robot | null>;
  refreshRobots: () => Promise<void>;
}

export const useMultiRobotAPI = (): UseMultiRobotAPIReturn => {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: any, defaultMessage: string) => {
    const errorMessage = err.response?.data?.error || err.message || defaultMessage;
    setError(errorMessage);
    message.error(errorMessage);
    console.error(errorMessage, err);
    return false;
  };

  const refreshRobots = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/robots`);
      setRobots(response.data.robots);
    } catch (err) {
      console.error('Failed to refresh robots:', err);
    }
  }, []);

  // Refresh robots list periodically
  useEffect(() => {
    refreshRobots();
    const interval = setInterval(refreshRobots, 3000);
    return () => clearInterval(interval);
  }, [refreshRobots]);

  const addRobot = useCallback(
    async (robotId: string, robotIp: string): Promise<boolean> => {
      setLoading(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/robots`, {
          // eslint-disable-next-line camelcase
          robot_id: robotId,
          // eslint-disable-next-line camelcase
          robot_ip: robotIp,
        });

        if (response.data.success) {
          message.success(`Robot ${robotId} added`);
          await refreshRobots();
          return true;
        }
        return false;
      } catch (err) {
        return handleError(err, 'Failed to add robot');
      } finally {
        setLoading(false);
      }
    },
    [refreshRobots],
  );

  const removeRobot = useCallback(
    async (robotId: string): Promise<boolean> => {
      try {
        const response = await axios.delete(`${API_BASE_URL}/robots/${robotId}`);
        if (response.data.success) {
          message.success(`Robot ${robotId} removed`);
          await refreshRobots();
          return true;
        }
        return false;
      } catch (err) {
        return handleError(err, 'Failed to remove robot');
      }
    },
    [refreshRobots],
  );

  const connectRobot = useCallback(
    async (robotId: string): Promise<boolean> => {
      setLoading(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/robots/${robotId}/connect`);
        if (response.data.success) {
          message.success(`Connected to ${robotId}`);
          await refreshRobots();
          return true;
        }
        return false;
      } catch (err) {
        return handleError(err, `Failed to connect to ${robotId}`);
      } finally {
        setLoading(false);
      }
    },
    [refreshRobots],
  );

  const disconnectRobot = useCallback(
    async (robotId: string): Promise<boolean> => {
      try {
        const response = await axios.post(`${API_BASE_URL}/robots/${robotId}/disconnect`);
        if (response.data.success) {
          message.success(`Disconnected from ${robotId}`);
          await refreshRobots();
          return true;
        }
        return false;
      } catch (err) {
        return handleError(err, `Failed to disconnect from ${robotId}`);
      }
    },
    [refreshRobots],
  );

  const moveRobot = useCallback(
    async (robotId: string, linear: number, angular: number): Promise<boolean> => {
      try {
        const response = await axios.post(`${API_BASE_URL}/robots/${robotId}/move`, {
          linear,
          angular,
        });
        return response.data.success;
      } catch (err) {
        return handleError(err, `Failed to move ${robotId}`);
      }
    },
    [],
  );

  const stopRobot = useCallback(async (robotId: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/robots/${robotId}/stop`);
      return response.data.success;
    } catch (err) {
      return handleError(err, `Failed to stop ${robotId}`);
    }
  }, []);

  const sendGoal = useCallback(
    async (robotId: string, position: any, orientation: any): Promise<boolean> => {
      try {
        const response = await axios.post(`${API_BASE_URL}/robots/${robotId}/goal`, {
          position,
          orientation,
        });
        if (response.data.success) {
          message.success(`Goal sent to ${robotId}`);
          return true;
        }
        return false;
      } catch (err) {
        return handleError(err, `Failed to send goal to ${robotId}`);
      }
    },
    [],
  );

  const cancelGoal = useCallback(async (robotId: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/robots/${robotId}/cancel`);
      if (response.data.success) {
        message.success(`Goal cancelled for ${robotId}`);
        return true;
      }
      return false;
    } catch (err) {
      return handleError(err, `Failed to cancel goal for ${robotId}`);
    }
  }, []);

  const getRobotStatus = useCallback(async (robotId: string): Promise<Robot | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/robots/${robotId}/status`);
      return response.data;
    } catch (err) {
      console.error(`Failed to get status for ${robotId}:`, err);
      return null;
    }
  }, []);

  return {
    robots,
    loading,
    error,
    addRobot,
    removeRobot,
    connectRobot,
    disconnectRobot,
    moveRobot,
    stopRobot,
    sendGoal,
    cancelGoal,
    getRobotStatus,
    refreshRobots,
  };
};
