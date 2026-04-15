import React, { useEffect, useState } from 'react';
import { Card, Alert, Button, Space, Typography, Tag, Descriptions } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface RosConnectionDiagnosticProps {
  ros: any;
  connected: boolean;
  robotIp: string;
}

export const RosConnectionDiagnostic: React.FC<RosConnectionDiagnosticProps> = ({
  ros,
  connected,
  robotIp,
}) => {
  const [diagnostics, setDiagnostics] = useState({
    rosLibLoaded: false,
    rosObjectExists: false,
    rosConnected: false,
    rosUrl: '',
    websocketState: '',
  });

  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    const check = () => {
      const diag = {
        rosLibLoaded: !!window.ROSLIB,
        rosObjectExists: !!ros,
        rosConnected: ros?.isConnected ? ros.isConnected() : false,
        rosUrl: ros?.socket?.url || 'Not available',
        websocketState:
          ros?.socket?.readyState !== undefined
            ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ros.socket.readyState]
            : 'Unknown',
      };
      setDiagnostics(diag);
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [ros]);

  useEffect(() => {
    if (!ros) return;

    const handleConnection = () => {
      addLog('✅ ROS Connected!');
    };

    const handleClose = () => {
      addLog('❌ ROS Connection Closed');
    };

    const handleError = (error: any) => {
      addLog(`❌ ROS Error: ${error?.message || JSON.stringify(error)}`);
    };

    ros.on('connection', handleConnection);
    ros.on('close', handleClose);
    ros.on('error', handleError);

    addLog('🎯 Event listeners attached to ROS object');

    return () => {
      ros.off('connection', handleConnection);
      ros.off('close', handleClose);
      ros.off('error', handleError);
    };
  }, [ros]);

  const testWebSocket = async () => {
    const wsUrl = `ws://${robotIp}:9090`;
    addLog(`🔍 Testing WebSocket connection to: ${wsUrl}`);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        addLog('✅ WebSocket test successful! Connection opened.');
        ws.close();
      };

      ws.onerror = (error) => {
        addLog('❌ WebSocket test failed! Cannot connect.');
      };

      ws.onclose = () => {
        addLog('WebSocket test connection closed.');
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          addLog('⏱️ WebSocket test timeout - rosbridge may not be running');
          ws.close();
        }
      }, 5000);
    } catch (error) {
      addLog(`❌ WebSocket test error: ${error}`);
    }
  };

  const StatusIcon = ({ ok }: { ok: boolean }) =>
    ok ? (
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
    ) : (
      <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
    );

  return (
    <Card title='ROS Connection Diagnostics'>
      <Space direction='vertical' style={{ width: '100%' }} size='large'>
        <Descriptions bordered column={1} size='small'>
          <Descriptions.Item
            label={
              <>
                <StatusIcon ok={diagnostics.rosLibLoaded} /> ROSLIB Loaded
              </>
            }
          >
            {diagnostics.rosLibLoaded ? 'Yes' : 'No'}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <>
                <StatusIcon ok={diagnostics.rosObjectExists} /> ROS Object Exists
              </>
            }
          >
            {diagnostics.rosObjectExists ? 'Yes' : 'No'}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <>
                <StatusIcon ok={connected} /> Connected (prop)
              </>
            }
          >
            {connected ? 'Yes' : 'No'}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <>
                <StatusIcon ok={diagnostics.rosConnected} /> ROS isConnected()
              </>
            }
          >
            {diagnostics.rosConnected ? 'Yes' : 'No'}
          </Descriptions.Item>

          <Descriptions.Item label='WebSocket State'>
            <Tag color={diagnostics.websocketState === 'OPEN' ? 'success' : 'error'}>
              {diagnostics.websocketState}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label='ROS URL'>
            <code>{diagnostics.rosUrl}</code>
          </Descriptions.Item>
        </Descriptions>

        <Button onClick={testWebSocket} type='primary'>
          Test WebSocket Connection
        </Button>

        {!diagnostics.rosConnected && diagnostics.rosObjectExists && (
          <Alert
            type='error'
            message='ROS Object exists but not connected'
            description={
              <div>
                <Paragraph>
                  The ROS object has been created but the connection is not established. This
                  usually means:
                </Paragraph>
                <ul>
                  <li>
                    <strong>rosbridge_server is not running</strong> on the robot
                  </li>
                  <li>The robot IP ({robotIp}) is incorrect</li>
                  <li>Port 9090 is blocked by a firewall</li>
                  <li>The robot is not reachable on the network</li>
                </ul>
                <Paragraph strong>On your robot, run:</Paragraph>
                <pre style={{ background: '#f5f5f5', padding: '8px' }}>
                  roslaunch rosbridge_server rosbridge_websocket.launch
                </pre>
              </div>
            }
            showIcon
          />
        )}

        <Card title='Event Log' size='small' style={{ maxHeight: '200px', overflow: 'auto' }}>
          <pre style={{ fontSize: '11px', margin: 0 }}>
            {logs.length > 0 ? logs.join('\n') : 'No events yet...'}
          </pre>
        </Card>

        <Alert
          type='info'
          message='Quick Check Commands (Run on Robot)'
          description={
            <pre style={{ margin: 0 }}>
              {`# Check if rosbridge is running
rosnode list | grep rosbridge

# Start rosbridge if not running  
roslaunch rosbridge_server rosbridge_websocket.launch

# Check network connectivity from your PC
ping ${robotIp}

# Check if port 9090 is open (from your PC)
telnet ${robotIp} 9090`}
            </pre>
          }
        />
      </Space>
    </Card>
  );
};
