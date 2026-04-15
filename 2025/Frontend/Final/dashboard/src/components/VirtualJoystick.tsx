// import { useEffect, useRef, useState, useCallback } from 'react';
// import { Card, Typography, Slider, Space } from 'antd';
// import { useBackendAPI } from '../hooks/useBackendAPI';

// interface VirtualJoystickProps {
//   cmdVelTopic: TopicInstance | null;
//   maxLinearSpeed?: number;
//   maxAngularSpeed?: number;
// }

// export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
//   cmdVelTopic,
//   maxLinearSpeed = 0.5,
//   maxAngularSpeed = 1.0,
// }) => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [isDragging, setIsDragging] = useState(false);
//   const [position, setPosition] = useState({ x: 0, y: 0 });
//   const animationFrameRef = useRef<number>();

//   const canvasSize = 200;
//   const center = canvasSize / 2;
//   const maxRadius = canvasSize / 2 - 20;

//   const drawJoystick = useCallback(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext('2d');
//     if (!ctx) return;

//     // Clear canvas
//     ctx.clearRect(0, 0, canvasSize, canvasSize);

//     // Draw outer circle
//     ctx.beginPath();
//     ctx.arc(center, center, maxRadius, 0, 2 * Math.PI);
//     ctx.strokeStyle = '#ccc';
//     ctx.lineWidth = 2;
//     ctx.stroke();

//     // Draw center point
//     ctx.beginPath();
//     ctx.arc(center, center, 5, 0, 2 * Math.PI);
//     ctx.fillStyle = '#666';
//     ctx.fill();

//     // Draw joystick position
//     ctx.beginPath();
//     ctx.arc(center + position.x, center + position.y, 20, 0, 2 * Math.PI);
//     ctx.fillStyle = isDragging ? '#4CAF50' : '#2196F3';
//     ctx.fill();
//   }, [position, isDragging, center, maxRadius]);

//   useEffect(() => {
//     drawJoystick();
//   }, [drawJoystick]);

//   const handleMove = useCallback(
//     (clientX: number, clientY: number) => {
//       const canvas = canvasRef.current;
//       if (!canvas || !connected) return;

//       const rect = canvas.getBoundingClientRect();
//       const x = clientX - rect.left - center;
//       const y = clientY - rect.top - center;

//       // Limit to circle
//       const distance = Math.sqrt(x * x + y * y);
//       let newX = x;
//       let newY = y;

//       if (distance > maxRadius) {
//         newX = (x / distance) * maxRadius;
//         newY = (y / distance) * maxRadius;
//       }

//       setPosition({ x: newX, y: newY });

//       // Send velocity commands
//       if (cmdVelTopic && window.ROSLIB) {
//         const linear = -(newY / maxRadius) * maxLinearSpeed;
//         const angular = -(newX / maxRadius) * maxAngularSpeed;

//         const twist = new window.ROSLIB.Message({
//           linear: { x: linear, y: 0, z: 0 },
//           angular: { x: 0, y: 0, z: angular },
//         });
//         cmdVelTopic.publish(twist);
//       }
//     },
//     [cmdVelTopic, maxLinearSpeed, maxAngularSpeed, center, maxRadius],
//   );

//   const handleStart = (clientX: number, clientY: number) => {
//     setIsDragging(true);
//     handleMove(clientX, clientY);
//   };

//   const handleEnd = () => {
//     setIsDragging(false);
//     setPosition({ x: 0, y: 0 });

//     // Stop robot
//     if (cmdVelTopic && window.ROSLIB) {
//       const twist = new window.ROSLIB.Message({
//         linear: { x: 0, y: 0, z: 0 },
//         angular: { x: 0, y: 0, z: 0 },
//       });
//       cmdVelTopic.publish(twist);
//     }
//   };

//   // Mouse events
//   const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     handleStart(e.clientX, e.clientY);
//   };

//   const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
//     if (isDragging) {
//       handleMove(e.clientX, e.clientY);
//     }
//   };

//   const handleMouseUp = () => {
//     handleEnd();
//   };

//   // Touch events
//   const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
//     e.preventDefault();
//     const touch = e.touches[0];
//     handleStart(touch.clientX, touch.clientY);
//   };

//   const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
//     e.preventDefault();
//     if (isDragging) {
//       const touch = e.touches[0];
//       handleMove(touch.clientX, touch.clientY);
//     }
//   };

//   const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
//     e.preventDefault();
//     handleEnd();
//   };

//   return (
//     <div className='virtual-joystick'>
//       <h3>Virtual Joystick</h3>
//       <canvas
//         ref={canvasRef}
//         width={canvasSize}
//         height={canvasSize}
//         onMouseDown={handleMouseDown}
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//         onMouseLeave={handleMouseUp}
//         onTouchStart={handleTouchStart}
//         onTouchMove={handleTouchMove}
//         onTouchEnd={handleTouchEnd}
//         style={{ border: '1px solid #ccc', borderRadius: '8px', cursor: 'pointer' }}
//       />
//       <p style={{ fontSize: '12px', color: '#666' }}>Drag to control robot movement</p>
//     </div>
//   );
// };

// -=================== version 2 =====================

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, Typography, Slider, Space } from 'antd';
import { useBackendAPI } from '../hooks/useBackendAPI';

const { Title, Text } = Typography;

export const VirtualJoystick: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [maxLinearSpeed, setMaxLinearSpeed] = useState(0.5);
  const [maxAngularSpeed, setMaxAngularSpeed] = useState(1.0);

  const { connected, moveRobot } = useBackendAPI();

  const canvasSize = 250;
  const center = canvasSize / 2;
  const maxRadius = canvasSize / 2 - 20;

  const drawJoystick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    ctx.beginPath();
    ctx.arc(center, center, maxRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#d9d9d9';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#bfbfbf';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(center + position.x, center + position.y, 25, 0, 2 * Math.PI);
    ctx.fillStyle = isDragging ? '#40a9ff' : '#1890ff';
    ctx.fill();
  }, [position, isDragging, center, maxRadius]);

  useEffect(() => {
    drawJoystick();
  }, [drawJoystick]);

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !connected) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left - center;
      const y = clientY - rect.top - center;

      const distance = Math.sqrt(x * x + y * y);
      let newX = x;
      let newY = y;

      if (distance > maxRadius) {
        newX = (x / distance) * maxRadius;
        newY = (y / distance) * maxRadius;
      }

      setPosition({ x: newX, y: newY });

      const linear = -(newY / maxRadius) * maxLinearSpeed;
      const angular = -(newX / maxRadius) * maxAngularSpeed;

      moveRobot(linear, angular);
    },
    [connected, maxLinearSpeed, maxAngularSpeed, center, maxRadius, moveRobot],
  );

  const handleEnd = () => {
    setIsDragging(false);
    setPosition({ x: 0, y: 0 });
    if (connected) {
      moveRobot(0, 0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      handleMove(e.clientX, e.clientY);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDragging) {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleEnd();
  };

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          Virtual Joystick
        </Title>
      }
    >
      <Space direction='vertical' size='large' style={{ width: '100%', alignItems: 'center' }}>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            border: '2px solid #f0f0f0',
            borderRadius: '8px',
            cursor: connected ? 'pointer' : 'not-allowed',
            touchAction: 'none',
            opacity: connected ? 1 : 0.5,
          }}
        />

        <Text type='secondary' style={{ fontSize: '12px' }}>
          {connected ? 'Drag to control robot movement' : 'Connect to robot first'}
        </Text>

        <Space direction='vertical' style={{ width: '100%' }}>
          <div>
            <Text>Max Linear Speed: {maxLinearSpeed.toFixed(2)} m/s</Text>
            <Slider
              min={0.1}
              max={1.0}
              step={0.1}
              value={maxLinearSpeed}
              onChange={setMaxLinearSpeed}
              disabled={!connected}
            />
          </div>
          <div>
            <Text>Max Angular Speed: {maxAngularSpeed.toFixed(2)} rad/s</Text>
            <Slider
              min={0.1}
              max={2.0}
              step={0.1}
              value={maxAngularSpeed}
              onChange={setMaxAngularSpeed}
              disabled={!connected}
            />
          </div>
        </Space>
      </Space>
    </Card>
  );
};
