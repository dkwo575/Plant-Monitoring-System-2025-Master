import { useState, useEffect } from 'react';
import { Card, Tabs, Button, Space, Badge, Tag, Alert } from 'antd';
import {
  RobotOutlined,
  VideoCameraOutlined,
  DashboardOutlined,
  CompassOutlined,
  ApiOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useMultiRobotAPI, Robot } from '../hooks/useMultiRobotAPI';
import { RobotControl } from '../components/TurtlebotControl';
import { CameraFeed } from '../components/CameraROS';
import { RobotStatus } from '../components/RobotStatus';
import { NavigationControl } from '../components/NavigationControl';
import { VirtualJoystick } from '../components/VirtualJoystick';

interface RobotControlPanelProps {
  robot: Robot;
  robotId: string;
  robotIp: string;
}

export const RobotControlPanel: React.FC<RobotControlPanelProps> = ({ robot }) => {
  const { connectRobot, disconnectRobot, loading } = useMultiRobotAPI();
  const [activeTab, setActiveTab] = useState('control');

  const handleConnect = async () => {
    await connectRobot(robot.robot_id);
  };

  const handleDisconnect = async () => {
    await disconnectRobot(robot.robot_id);
  };

  const tabItems = [
    {
      key: 'control',
      label: (
        <span>
          <RobotOutlined />
          Control
        </span>
      ),
      children: (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <RobotControl robotId={robot.robot_id} connected={robot.connected} />
          <VirtualJoystick robotId={robot.robot_id} connected={robot.connected} />
        </div>
      ),
    },
    {
      key: 'camera',
      label: (
        <span>
          <VideoCameraOutlined />
          Camera
        </span>
      ),
      children: <CameraFeed robotIp={robot.robot_ip} />,
    },
    {
      key: 'status',
      label: (
        <span>
          <DashboardOutlined />
          Status
        </span>
      ),
      children: <RobotStatus robotId={robot.robot_id} robotState={robot.state} />,
    },
    {
      key: 'navigation',
      label: (
        <span>
          <CompassOutlined />
          Navigation
        </span>
      ),
      children: <NavigationControl robotId={robot.robot_id} connected={robot.connected} />,
    },
  ];

  return (
    <div>
      {/* Connection Panel */}
      <Card style={{ marginBottom: '16px' }}>
        <Space size='middle' style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Tag color={robot.connected ? 'success' : 'default'} style={{ fontSize: '14px' }}>
              {robot.connected ? 'Connected' : 'Disconnected'}
            </Tag>
            <span>
              <strong>Robot ID:</strong> {robot.robot_id}
            </span>
            <span>
              <strong>IP:</strong> {robot.robot_ip}
            </span>
          </Space>

          {!robot.connected ? (
            <Button type='primary' icon={<ApiOutlined />} onClick={handleConnect} loading={loading}>
              Connect
            </Button>
          ) : (
            <Button
              danger
              icon={<DisconnectOutlined />}
              onClick={handleDisconnect}
              loading={loading}
            >
              Disconnect
            </Button>
          )}
        </Space>
      </Card>

      {/* Control Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size='large' />
    </div>
  );
};
