import { useEffect, useState } from 'react';
import { Card, Typography, Tag, Space, Alert } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import { useBackendAPI } from '../hooks/useBackendAPI';

const { Title, Text } = Typography;

// Add this to your TurtlebotPage.tsx imports:
// import { KeyboardControl } from '../components/KeyboardControl';

export const KeyboardControl: React.FC = () => {
  const { connected, moveRobot, stopRobot } = useBackendAPI();
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [isEnabled, setIsEnabled] = useState(false);

  // Speed settings
  const linearSpeed = 0.3;
  const angularSpeed = 0.7;

  useEffect(() => {
    if (!connected || !isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default browser behavior for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
      }

      const key = e.key.toLowerCase();

      // Add key to active keys
      setActiveKeys((prev) => new Set(prev).add(key));

      // Execute movement based on key
      switch (key) {
        case 'w':
        case 'arrowup':
          moveRobot(linearSpeed, 0);
          break;
        case 's':
        case 'arrowdown':
          moveRobot(-linearSpeed, 0);
          break;
        case 'a':
        case 'arrowleft':
          moveRobot(0, angularSpeed);
          break;
        case 'd':
        case 'arrowright':
          moveRobot(0, -angularSpeed);
          break;
        case ' ':
          stopRobot();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      setActiveKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });

      // Stop robot when key is released (if no other movement keys are pressed)
      if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        stopRobot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [connected, isEnabled, moveRobot, stopRobot]);

  // Enable keyboard control when card is clicked
  const handleCardClick = () => {
    if (connected) {
      setIsEnabled(true);
    }
  };

  // Disable when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.keyboard-control-card')) {
        setIsEnabled(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const isKeyActive = (key: string) => activeKeys.has(key);

  return (
    <Card
      className='keyboard-control-card'
      title={
        <Space>
          <KeyOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Keyboard Control
          </Title>
        </Space>
      }
      extra={
        <Tag color={isEnabled ? 'success' : 'default'}>{isEnabled ? 'Active' : 'Inactive'}</Tag>
      }
      onClick={handleCardClick}
      style={{
        cursor: connected ? 'pointer' : 'not-allowed',
        border: isEnabled ? '2px solid #52c41a' : undefined,
      }}
    >
      <Space direction='vertical' size='large' style={{ width: '100%' }}>
        {!connected && (
          <Alert
            message='Robot Disconnected'
            description='Connect to robot to enable keyboard control'
            type='warning'
            showIcon
          />
        )}

        {connected && !isEnabled && (
          <Alert
            message='Click card to activate'
            description='Click this card to enable keyboard control'
            type='info'
            showIcon
          />
        )}

        {connected && isEnabled && (
          <Alert
            message='Keyboard Control Active'
            description='Use arrow keys or WASD to control the robot. Press SPACE to stop.'
            type='success'
            showIcon
          />
        )}

        <div style={{ textAlign: 'center' }}>
          <Text strong>Keyboard Layout:</Text>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 80px)',
              gap: '8px',
              margin: '20px auto',
              justifyContent: 'center',
            }}
          >
            {/* First row */}
            <div />
            <KeyButton
              label='W / ↑'
              active={isKeyActive('w') || isKeyActive('arrowup')}
              description='Forward'
            />
            <div />

            {/* Second row */}
            <KeyButton
              label='A / ←'
              active={isKeyActive('a') || isKeyActive('arrowleft')}
              description='Left'
            />
            <KeyButton
              label='S / ↓'
              active={isKeyActive('s') || isKeyActive('arrowdown')}
              description='Back'
            />
            <KeyButton
              label='D / →'
              active={isKeyActive('d') || isKeyActive('arrowright')}
              description='Right'
            />
          </div>

          <div style={{ marginTop: '20px' }}>
            <KeyButton label='SPACE' active={isKeyActive(' ')} description='Emergency Stop' wide />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Space direction='vertical' size='small'>
            <Text type='secondary'>Linear Speed: {linearSpeed} m/s</Text>
            <Text type='secondary'>Angular Speed: {angularSpeed} rad/s</Text>
          </Space>
        </div>
      </Space>
    </Card>
  );
};

interface KeyButtonProps {
  label: string;
  active: boolean;
  description: string;
  wide?: boolean;
}

const KeyButton: React.FC<KeyButtonProps> = ({ label, active, description, wide }) => {
  return (
    <div
      style={{
        gridColumn: wide ? 'span 3' : undefined,
        width: wide ? '250px' : '80px',
        margin: wide ? '0 auto' : undefined,
      }}
    >
      <div
        style={{
          padding: '12px',
          border: active ? '3px solid #52c41a' : '2px solid #d9d9d9',
          borderRadius: '8px',
          backgroundColor: active ? '#f6ffed' : '#fafafa',
          fontWeight: 'bold',
          fontSize: '14px',
          textAlign: 'center',
          transition: 'all 0.2s',
          boxShadow: active ? '0 0 10px rgba(82, 196, 26, 0.5)' : 'none',
        }}
      >
        {label}
      </div>
      <Text type='secondary' style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
        {description}
      </Text>
    </div>
  );
};
