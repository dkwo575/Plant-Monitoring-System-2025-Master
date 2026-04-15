// useMultiRobot.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';

const API_BASE_URL = 'http://localhost:5000/api';

interface RobotInfo {
  robot_id: string;
  robot_type: string;
  ip_address: string;
  rosbridge_port: number;
  capabilities: string[];
}

interface RobotState {
  connected: boolean;
  type: string;
  ip: string;
  capabilities: string[];
  state: {
    battery: {
      percentage: number;
      voltage: number;
      current: number;
    };
    odometry: {
      x: number;
      y: number;
      theta: number;
    };
    velocity: {
      linear: number;
      angular: number;
    };
    mode: string;
    patrol_active: boolean;
  };
}

interface UseMultiRobotReturn {
  robots: Record<string, RobotState>;
  loading: boolean;
  error: string | null;
  selectedRobot: string | null;
  selectRobot: (robotId: string) => void;
  registerRobot: (robotInfo: RobotInfo) => Promise<boolean>;
  connectRobot: (robotId: string) => Promise<boolean>;
  disconnectRobot: (robotId: string) => Promise<boolean>;
  moveRobot: (robotId: string, linear: number, angular: number) => Promise<boolean>;
  stopRobot: (robotId: string) => Promise<boolean>;
  sendGoal: (robotId: string, position: any, orientation: any) => Promise<boolean>;
  cancelNavigation: (robotId: string) => Promise<boolean>;
  refreshRobots: () => Promise<void>;
}

export const useMultiRobot = (): UseMultiRobotReturn => {
  const [robots, setRobots] = useState<Record<string, RobotState>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<string | null>(null);

  // Fetch all robots on mount
  useEffect(() => {
    refreshRobots();
    const interval = setInterval(refreshRobots, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleError = (err: any, defaultMessage: string) => {
    const errorMessage = err.response?.data?.error || err.message || defaultMessage;
    setError(errorMessage);
    message.error(errorMessage);
    console.error(errorMessage, err);
    return false;
  };

  const refreshRobots = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/robots`);
      setRobots(response.data.robots);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh robots:', err);
    }
  }, []);

  const selectRobot = useCallback((robotId: string) => {
    setSelectedRobot(robotId);
  }, []);

  const registerRobot = useCallback(
    async (robotInfo: RobotInfo): Promise<boolean> => {
      setLoading(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/robots/register`, robotInfo);

        if (response.data.success) {
          message.success(`Robot ${robotInfo.robot_id} registered successfully`);
          await refreshRobots();
          return true;
        }
        return false;
      } catch (err) {
        return handleError(err, 'Failed to register robot');
      } finally {
        setLoading(false);
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
          setError(null);
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

        if (response.data.success) {
          return true;
        }
        return false;
      } catch (err) {
        return handleError(err, `Failed to move ${robotId}`);
      }
    },
    [],
  );

  const stopRobot = useCallback(async (robotId: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/robots/${robotId}/stop`, {});
      if (response.data.success) {
        return true;
      }
      return false;
    } catch (err) {
      return handleError(err, `Failed to stop ${robotId}`);
    }
  }, []);

  const sendGoal = useCallback(
    async (robotId: string, position: any, orientation: any): Promise<boolean> => {
      try {
        const response = await axios.post(`${API_BASE_URL}/robots/${robotId}/navigation/goal`, {
          position,
          orientation,
        });

        if (response.data.success) {
          message.success('Navigation goal sent');
          return true;
        }
        return false;
      } catch (err) {
        return handleError(err, 'Failed to send navigation goal');
      }
    },
    [],
  );

  const cancelNavigation = useCallback(async (robotId: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/robots/${robotId}/navigation/cancel`);
      if (response.data.success) {
        message.success('Navigation cancelled');
        return true;
      }
      return false;
    } catch (err) {
      return handleError(err, 'Failed to cancel navigation');
    }
  }, []);

  return {
    robots,
    loading,
    error,
    selectedRobot,
    selectRobot,
    registerRobot,
    connectRobot,
    disconnectRobot,
    moveRobot,
    stopRobot,
    sendGoal,
    cancelNavigation,
    refreshRobots,
  };
};
