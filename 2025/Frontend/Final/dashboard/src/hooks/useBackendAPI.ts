import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';

const API_BASE_URL = 'http://localhost:5000/api';

interface RobotStatus {
  connected: boolean;
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
}

interface UseBackendAPIReturn {
  connected: boolean;
  loading: boolean;
  error: string | null;
  robotStatus: RobotStatus | null;
  connectRobot: (robotIp: string) => Promise<boolean>;
  disconnectRobot: () => Promise<boolean>;
  moveRobot: (linear: number, angular: number) => Promise<boolean>;
  stopRobot: () => Promise<boolean>;
  sendGoal: (position: any, orientation: any) => Promise<boolean>;
  cancelNavigation: () => Promise<boolean>;
  startPatrol: (waypoints: any[]) => Promise<boolean>;
  stopPatrol: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

export const useBackendAPI = (): UseBackendAPIReturn => {
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [robotStatus, setRobotStatus] = useState<RobotStatus | null>(null);

  // Health check interval
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/robot/health`);
        setConnected(response.data.ros_connected);
        setError(null);
      } catch (err) {
        setConnected(false);
        setError('Backend connection failed');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleError = (err: any, defaultMessage: string) => {
    const errorMessage = err.response?.data?.error || err.message || defaultMessage;
    setError(errorMessage);
    message.error(errorMessage);
    console.error(errorMessage, err);
    return false;
  };

  const connectRobot = useCallback(async (robotIp: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/robot/connect`, {
        robot_ip: robotIp,
      });

      if (response.data.success) {
        setConnected(true);
        setError(null);
        message.success('Connected to robot');
        return true;
      }
      return false;
    } catch (err) {
      return handleError(err, 'Failed to connect to robot');
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectRobot = useCallback(async (): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/robot/disconnect`);
      if (response.data.success) {
        setConnected(false);
        message.success('Disconnected from robot');
        return true;
      }
      return false;
    } catch (err) {
      return handleError(err, 'Failed to disconnect');
    }
  }, []);

  const moveRobot = useCallback(async (linear: number, angular: number): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/control/move`, {
        linear,
        angular,
      });

      if (response.data.success) {
        return true;
      }
      return false;
    } catch (err) {
      return handleError(err, 'Failed to move robot');
    }
  }, []);

  const stopRobot = useCallback(async (): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/control/stop`, {});
      if (response.data.success) {
        return true;
      }
      return false;
    } catch (err) {
      return handleError(err, 'Failed to stop robot');
    }
  }, []);

  const sendGoal = useCallback(async (position: any, orientation: any): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/navigation/goal`, {
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
  }, []);

  const cancelNavigation = useCallback(async (): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/navigation/cancel`);
      if (response.data.success) {
        message.success('Navigation cancelled');
        return true;
      }
      return false;
    } catch (err) {
      return handleError(err, 'Failed to cancel navigation');
    }
  }, []);

  const startPatrol = useCallback(async (waypoints: any[]): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/patrol/start`, {
        waypoints,
      });

      if (response.data.success) {
        message.success(`Patrol started with ${waypoints.length} waypoints`);
        return true;
      }
      return false;
    } catch (err) {
      return handleError(err, 'Failed to start patrol');
    }
  }, []);

  const stopPatrol = useCallback(async (): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/patrol/stop`);
      if (response.data.success) {
        message.success('Patrol stopped');
        return true;
      }
      return false;
    } catch (err) {
      return handleError(err, 'Failed to stop patrol');
    }
  }, []);

  const refreshStatus = useCallback(async (): Promise<void> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/robot/status`);
      setRobotStatus(response.data);
    } catch (err) {
      console.error('Failed to refresh status:', err);
    }
  }, []);

  // Refresh status periodically when connected
  useEffect(() => {
    if (connected) {
      refreshStatus();
      const interval = setInterval(refreshStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [connected, refreshStatus]);

  return {
    connected,
    loading,
    error,
    robotStatus,
    connectRobot,
    disconnectRobot,
    moveRobot,
    stopRobot,
    sendGoal,
    cancelNavigation,
    startPatrol,
    stopPatrol,
    refreshStatus,
  };
};
