// import { useEffect, useState, useCallback } from 'react';
// import { Card, Button, Space, Typography, Tag } from 'antd';
// import {
//   ArrowUpOutlined,
//   ArrowDownOutlined,
//   ArrowLeftOutlined,
//   ArrowRightOutlined,
//   PauseOutlined,
// } from '@ant-design/icons';
// import { useRosConnection } from '../hooks/UseRosConnection';
// import type { TopicInstance, Twist } from '../types/roslib';

// const { Title, Text } = Typography;

// interface RobotControlProps {
//   robotIp?: string;
//   linearSpeed?: number;
//   angularSpeed?: number;
// }

// export const RobotControl: React.FC<RobotControlProps> = ({
//   robotIp = 'localhost',
//   linearSpeed = 0.2,
//   angularSpeed = 0.5,
// }) => {
//   const rosUrl = `ws://${robotIp}:9090`;
//   const { ros, connected, error } = useRosConnection(rosUrl);
//   const [cmdVelTopic, setCmdVelTopic] = useState<TopicInstance | null>(null);

//   useEffect(() => {
//     if (ros && connected && window.ROSLIB) {
//       const topic = new window.ROSLIB.Topic({
//         ros: ros,
//         name: '/cmd_vel',
//         messageType: 'geometry_msgs/Twist',
//       });
//       setCmdVelTopic(topic);

//       return () => {
//         topic.unadvertise();
//       };
//     }
//   }, [ros, connected]);

//   const moveRobot = useCallback(
//     (linear: number, angular: number) => {
//       if (cmdVelTopic && window.ROSLIB) {
//         const twist: Twist = {
//           linear: { x: linear, y: 0, z: 0 },
//           angular: { x: 0, y: 0, z: angular },
//         };

//         const message = new window.ROSLIB.Message(twist);
//         cmdVelTopic.publish(message);
//       }
//     },
//     [cmdVelTopic],
//   );

//   const stopRobot = useCallback(() => {
//     moveRobot(0, 0);
//   }, [moveRobot]);

//   const handleForward = () => moveRobot(linearSpeed, 0);
//   const handleBackward = () => moveRobot(-linearSpeed, 0);
//   const handleLeft = () => moveRobot(0, angularSpeed);
//   const handleRight = () => moveRobot(0, -angularSpeed);

//   return (
//     <Card
//       title={
//         <Title level={4} style={{ margin: 0 }}>
//           Robot Control
//         </Title>
//       }
//       extra={
//         <Tag color={connected ? 'success' : 'error'}>
//           {connected ? 'Connected' : 'Disconnected'}
//         </Tag>
//       }
//     >
//       <Space direction='vertical' size='large' style={{ width: '100%' }}>
//         {error && <Text type='danger'>Error: {error}</Text>}

//         <div
//           style={{
//             display: 'grid',
//             gridTemplateColumns: 'repeat(3, 1fr)',
//             gap: '12px',
//             maxWidth: '300px',
//             margin: '0 auto',
//           }}
//         >
//           <div></div>
//           <Button
//             type='primary'
//             size='large'
//             icon={<ArrowUpOutlined />}
//             onClick={handleForward}
//             disabled={!connected}
//             block
//           >
//             Forward
//           </Button>
//           <div></div>

//           <Button
//             type='primary'
//             size='large'
//             icon={<ArrowLeftOutlined />}
//             onClick={handleLeft}
//             disabled={!connected}
//             block
//           >
//             Left
//           </Button>
//           <Button
//             danger
//             size='large'
//             icon={<PauseOutlined />}
//             onClick={stopRobot}
//             disabled={!connected}
//             block
//           >
//             Stop
//           </Button>
//           <Button
//             type='primary'
//             size='large'
//             icon={<ArrowRightOutlined />}
//             onClick={handleRight}
//             disabled={!connected}
//             block
//           >
//             Right
//           </Button>

//           <div></div>
//           <Button
//             type='primary'
//             size='large'
//             icon={<ArrowDownOutlined />}
//             onClick={handleBackward}
//             disabled={!connected}
//             block
//           >
//             Backward
//           </Button>
//           <div></div>
//         </div>

//         <div style={{ textAlign: 'center', marginTop: '16px' }}>
//           <Space>
//             <Text type='secondary'>Linear Speed:</Text>
//             <Text strong>{linearSpeed} m/s</Text>
//           </Space>
//           <br />
//           <Space>
//             <Text type='secondary'>Angular Speed:</Text>
//             <Text strong>{angularSpeed} rad/s</Text>
//           </Space>
//         </div>
//       </Space>
//     </Card>
//   );
// };

// -------------------------- version2

import { useState } from 'react';
import { Card, Button, Space, Typography, Tag, Slider } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PauseOutlined,
} from '@ant-design/icons';
import { useBackendAPI } from '../hooks/useBackendAPI';

const { Title, Text } = Typography;

export const RobotControl: React.FC = () => {
  const { connected, loading, moveRobot, stopRobot } = useBackendAPI();
  const [linearSpeed, setLinearSpeed] = useState<number>(0.2);
  const [angularSpeed, setAngularSpeed] = useState<number>(0.5);

  const handleForward = async () => {
    await moveRobot(linearSpeed, 0);
  };

  const handleBackward = async () => {
    await moveRobot(-linearSpeed, 0);
  };

  const handleLeft = async () => {
    await moveRobot(0, angularSpeed);
  };

  const handleRight = async () => {
    await moveRobot(0, -angularSpeed);
  };

  const handleStop = async () => {
    await stopRobot();
  };

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          Robot Control
        </Title>
      }
      extra={
        <Tag color={connected ? 'success' : 'error'}>
          {connected ? 'Connected' : 'Disconnected'}
        </Tag>
      }
      loading={loading}
    >
      <Space direction='vertical' size='large' style={{ width: '100%' }}>
        {/* Speed Controls */}
        <div>
          <Text strong>Linear Speed: {linearSpeed.toFixed(2)} m/s</Text>
          <Slider
            min={0.1}
            max={0.7}
            step={0.1}
            value={linearSpeed}
            onChange={setLinearSpeed}
            disabled={!connected}
          />

          <Text strong>Angular Speed: {angularSpeed.toFixed(2)} rad/s</Text>
          <Slider
            min={0.1}
            max={1.5}
            step={0.1}
            value={angularSpeed}
            onChange={setAngularSpeed}
            disabled={!connected}
          />
        </div>

        {/* Direction Controls */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            maxWidth: '300px',
            margin: '0 auto',
          }}
        >
          <div></div>
          <Button
            type='primary'
            size='large'
            icon={<ArrowUpOutlined />}
            onClick={handleForward}
            disabled={!connected}
            block
          >
            Forward
          </Button>
          <div></div>

          <Button
            type='primary'
            size='large'
            icon={<ArrowLeftOutlined />}
            onClick={handleLeft}
            disabled={!connected}
            block
          >
            Left
          </Button>
          <Button
            danger
            size='large'
            icon={<PauseOutlined />}
            onClick={handleStop}
            disabled={!connected}
            block
          >
            Stop
          </Button>
          <Button
            type='primary'
            size='large'
            icon={<ArrowRightOutlined />}
            onClick={handleRight}
            disabled={!connected}
            block
          >
            Right
          </Button>

          <div></div>
          <Button
            type='primary'
            size='large'
            icon={<ArrowDownOutlined />}
            onClick={handleBackward}
            disabled={!connected}
            block
          >
            Backward
          </Button>
          <div></div>
        </div>
      </Space>
    </Card>
  );
};
