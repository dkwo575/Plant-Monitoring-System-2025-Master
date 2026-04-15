// import React, { useState, useEffect, useRef } from 'react';
// import {
//   Layout,
//   Card,
//   Button,
//   Badge,
//   Select,
//   Slider,
//   Row,
//   Col,
//   Space,
//   Typography,
//   Statistic,
//   List,
//   Image,
//   message,
//   Divider,
// } from 'antd';
// import {
//   CameraOutlined,
//   SettingOutlined,
//   DownloadOutlined,
//   PoweroffOutlined,
//   CloudUploadOutlined,
// } from '@ant-design/icons';

// const { Header, Content } = Layout;
// const { Title, Text } = Typography;
// const { Option } = Select;

// // Main Page Component
// const RobotControlPage: React.FC = () => {
//   const [isConnected, setIsConnected] = useState<boolean>(false);
//   const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);

//   const handleImageCaptured = (img: CapturedImage) => {
//     setCapturedImages([img, ...capturedImages]);
//     message.success('Image captured and uploaded successfully!');
//   };

//   return (
//     <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
//       <Header
//         style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
//       >
//         <Space align='center' style={{ height: '100%' }}>
//           <CameraOutlined style={{ fontSize: '28px', color: '#52c41a' }} />
//           <Title level={3} style={{ margin: 0 }}>
//             Smart Farm Monitoring System
//           </Title>
//         </Space>
//       </Header>

//       <Content style={{ padding: '24px' }}>
//         <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
//           <Text
//             type='secondary'
//             style={{ display: 'block', marginBottom: '24px', fontSize: '16px' }}
//           >
//             Real-time Intel RealSense D435 Camera Feed
//           </Text>

//           <Row gutter={[24, 24]}>
//             {/* Camera Feed - Takes up 16 columns (2/3 of layout) */}
//             <Col xs={24} lg={16}>
//               <CameraFeed
//                 isConnected={isConnected}
//                 setIsConnected={setIsConnected}
//                 onImageCaptured={handleImageCaptured}
//               />
//             </Col>

//             {/* Side Panel - Takes up 8 columns (1/3 of layout) */}
//             <Col xs={24} lg={8}>
//               <Space direction='vertical' style={{ width: '100%' }} size='large'>
//                 <CameraControls isConnected={isConnected} />
//                 <CaptureHistory images={capturedImages} />
//               </Space>
//             </Col>
//           </Row>
//         </div>
//       </Content>
//     </Layout>
//   );
// };

// // TypeScript Interfaces
// interface CapturedImage {
//   id: number;
//   url: string;
//   timestamp: string;
// }

// interface CameraFeedProps {
//   isConnected: boolean;
//   setIsConnected: (connected: boolean) => void;
//   onImageCaptured: (img: CapturedImage) => void;
// }

// // Camera Feed Component
// const CameraFeed: React.FC<CameraFeedProps> = ({
//   isConnected,
//   setIsConnected,
//   onImageCaptured,
// }) => {
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const wsRef = useRef<WebSocket | null>(null);
//   const [isCapturing, setIsCapturing] = useState<boolean>(false);
//   const [fps, setFps] = useState<number>(0);

//   useEffect(() => {
//     const connectWebSocket = () => {
//       // Replace with your actual WebSocket endpoint
//       // wsRef.current = new WebSocket('ws://localhost:5000/video_feed');

//       setIsConnected(true);
//       simulateVideoFeed();
//     };

//     const simulateVideoFeed = () => {
//       const canvas = canvasRef.current;
//       if (canvas) {
//         const ctx = canvas.getContext('2d');
//         if (!ctx) return;

//         let frameCount = 0;
//         const startTime = Date.now();

//         const animate = () => {
//           const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
//           gradient.addColorStop(0, '#1a472a');
//           gradient.addColorStop(1, '#2d5a3d');
//           ctx.fillStyle = gradient;
//           ctx.fillRect(0, 0, canvas.width, canvas.height);

//           ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
//           ctx.font = '20px Arial';
//           ctx.fillText('RealSense D435 Camera Feed', 20, 40);
//           ctx.font = '14px Arial';
//           ctx.fillText('Resolution: 1280x720 @ 15fps', 20, 70);
//           ctx.fillText('Press SPACE or click Capture button', 20, 100);

//           frameCount++;
//           const elapsed = (Date.now() - startTime) / 1000;
//           if (elapsed > 1) {
//             setFps(Math.round(frameCount / elapsed));
//           }

//           requestAnimationFrame(animate);
//         };
//         animate();
//       }
//     };

//     connectWebSocket();

//     return () => {
//       if (wsRef.current) {
//         wsRef.current.close();
//       }
//     };
//   }, [setIsConnected]);

//   useEffect(() => {
//     const handleKeyPress = (e: KeyboardEvent) => {
//       if (e.code === 'Space' && isConnected) {
//         e.preventDefault();
//         captureImage();
//       }
//     };

//     window.addEventListener('keydown', handleKeyPress);
//     return () => window.removeEventListener('keydown', handleKeyPress);
//   }, [isConnected]);

//   const captureImage = async () => {
//     setIsCapturing(true);

//     const canvas = canvasRef.current;
//     if (canvas) {
//       canvas.toBlob(async (blob) => {
//         if (!blob) return;

//         const formData = new FormData();
//         formData.append('file', blob, `capture_${Date.now()}.png`);
//         formData.append('client_id', 'realsense_client');
//         formData.append('client_name', 'camera_laptop');

//         try {
//           const response = await fetch('http://localhost:5000/upload', {
//             method: 'POST',
//             body: formData,
//           });

//           if (response.ok) {
//             const data = await response.json();
//             console.log('Image uploaded:', data);

//             const imageUrl = canvas.toDataURL();
//             onImageCaptured({
//               id: Date.now(),
//               url: imageUrl,
//               timestamp: new Date().toISOString(),
//             });
//           } else {
//             message.error('Failed to upload image');
//           }
//         } catch (error) {
//           console.error('Error uploading image:', error);
//           message.error('Error uploading image');
//         }

//         setIsCapturing(false);
//       }, 'image/png');
//     }
//   };

//   return (
//     <Card
//       title={
//         <Space>
//           <Badge status={isConnected ? 'success' : 'error'} />
//           <span>Live Camera Feed</span>
//         </Space>
//       }
//       extra={
//         <Space>
//           <Statistic title='FPS' value={fps} />
//           <Badge
//             status={isConnected ? 'processing' : 'default'}
//             text={isConnected ? 'Connected' : 'Disconnected'}
//           />
//         </Space>
//       }
//     >
//       <div
//         style={{
//           background: '#000',
//           borderRadius: '8px',
//           overflow: 'hidden',
//           marginBottom: '16px',
//         }}
//       >
//         <canvas
//           ref={canvasRef}
//           width={1280}
//           height={720}
//           style={{
//             width: '100%',
//             height: 'auto',
//             display: 'block',
//             opacity: isCapturing ? 0.5 : 1,
//             transition: 'opacity 0.2s',
//           }}
//         />
//       </div>

//       <Space style={{ width: '100%' }} direction='vertical'>
//         <Button
//           type='primary'
//           size='large'
//           icon={<CameraOutlined />}
//           onClick={captureImage}
//           disabled={!isConnected || isCapturing}
//           loading={isCapturing}
//           block
//           style={{ height: '48px', fontSize: '16px' }}
//         >
//           {isCapturing ? 'Capturing...' : 'Capture Image (SPACE)'}
//         </Button>
//         <Text type='secondary' style={{ display: 'block', textAlign: 'center' }}>
//           Press SPACE key or click the button to capture and upload image
//         </Text>
//       </Space>
//     </Card>
//   );
// };

// // Camera Controls Component
// interface CameraControlsProps {
//   isConnected: boolean;
// }

// const CameraControls: React.FC<CameraControlsProps> = ({ isConnected }) => {
//   const [resolution, setResolution] = useState<string>('1280x720');
//   const [frameRate, setFrameRate] = useState<number>(15);

//   return (
//     <Card
//       title={
//         <Space>
//           <SettingOutlined />
//           <span>Camera Settings</span>
//         </Space>
//       }
//     >
//       <Space direction='vertical' style={{ width: '100%' }} size='middle'>
//         <div>
//           <Text strong style={{ display: 'block', marginBottom: '8px' }}>
//             Resolution
//           </Text>
//           <Select
//             value={resolution}
//             onChange={setResolution}
//             disabled={!isConnected}
//             style={{ width: '100%' }}
//             size='large'
//           >
//             <Option value='640x480'>640 x 480</Option>
//             <Option value='1280x720'>1280 x 720</Option>
//             <Option value='1920x1080'>1920 x 1080</Option>
//           </Select>
//         </div>

//         <div>
//           <Text strong style={{ display: 'block', marginBottom: '8px' }}>
//             Frame Rate: {frameRate} FPS
//           </Text>
//           <Slider
//             min={6}
//             max={30}
//             value={frameRate}
//             onChange={setFrameRate}
//             disabled={!isConnected}
//             marks={{ 6: '6', 15: '15', 30: '30' }}
//           />
//         </div>

//         <Divider style={{ margin: '12px 0' }} />

//         <Row gutter={16}>
//           <Col span={12}>
//             <Statistic
//               title='Status'
//               value={isConnected ? 'Active' : 'Inactive'}
//               valueStyle={{ color: isConnected ? '#52c41a' : '#ff4d4f', fontSize: '16px' }}
//             />
//           </Col>
//           <Col span={12}>
//             <Statistic title='Device' value='D435' valueStyle={{ fontSize: '16px' }} />
//           </Col>
//         </Row>
//       </Space>
//     </Card>
//   );
// };

// // Capture History Component
// interface CaptureHistoryProps {
//   images: CapturedImage[];
// }

// const CaptureHistory: React.FC<CaptureHistoryProps> = ({ images }) => {
//   return (
//     <Card
//       title={
//         <Space>
//           <DownloadOutlined />
//           <span>Recent Captures</span>
//           <Badge count={images.length} showZero style={{ backgroundColor: '#52c41a' }} />
//         </Space>
//       }
//     >
//       {images.length === 0 ? (
//         <div style={{ textAlign: 'center', padding: '40px 0' }}>
//           <Text type='secondary'>No captures yet. Press SPACE to capture.</Text>
//         </div>
//       ) : (
//         <List
//           dataSource={images}
//           style={{ maxHeight: '400px', overflow: 'auto' }}
//           renderItem={(item) => (
//             <List.Item style={{ padding: '12px 0' }}>
//               <Card
//                 hoverable
//                 size='small'
//                 style={{ width: '100%' }}
//                 cover={
//                   <Image
//                     src={item.url}
//                     alt='Captured'
//                     style={{ height: '120px', objectFit: 'cover' }}
//                     preview={{
//                       mask: <CloudUploadOutlined style={{ fontSize: '24px' }} />,
//                     }}
//                   />
//                 }
//               >
//                 <Card.Meta
//                   description={
//                     <Text type='secondary' style={{ fontSize: '12px' }}>
//                       {new Date(item.timestamp).toLocaleString()}
//                     </Text>
//                   }
//                 />
//               </Card>
//             </List.Item>
//           )}
//         />
//       )}
//     </Card>
//   );
// };

// export default RobotControlPage;

// ------------------------------

// import React, { useState } from 'react';
// import { Layout, Space, Typography, Row, Col, message } from 'antd';
// import { CameraOutlined } from '@ant-design/icons';
// import CameraFeed from '../components/CameraFeed';
// import CameraControls from '../components/CameraControls';
// import CaptureHistory from '../components/CaptureHistory';
// import type { CapturedImage } from '../types/camera';

// const { Header, Content } = Layout;
// const { Title, Text } = Typography;

// const RobotControlPage: React.FC = () => {
//   const [isConnected, setIsConnected] = useState<boolean>(false);
//   const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);

//   const handleImageCaptured = (img: CapturedImage) => {
//     setCapturedImages([img, ...capturedImages]);
//     message.success('Image captured and uploaded successfully!');
//   };

//   return (
//     <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
//       <Header
//         style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
//       >
//         <Space align='center' style={{ height: '100%' }}>
//           <CameraOutlined style={{ fontSize: '28px', color: '#52c41a' }} />
//           <Title level={3} style={{ margin: 0 }}>
//             Smart Farm Monitoring System
//           </Title>
//         </Space>
//       </Header>

//       <Content style={{ padding: '24px' }}>
//         <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
//           <Text
//             type='secondary'
//             style={{ display: 'block', marginBottom: '24px', fontSize: '16px' }}
//           >
//             Real-time Intel RealSense D435 Camera Feed
//           </Text>

//           <Row gutter={[24, 24]}>
//             {/* Camera Feed - Takes up 16 columns (2/3 of layout) */}
//             <Col xs={24} lg={16}>
//               <CameraFeed
//                 isConnected={isConnected}
//                 setIsConnected={setIsConnected}
//                 onImageCaptured={handleImageCaptured}
//               />
//             </Col>

//             {/* Side Panel - Takes up 8 columns (1/3 of layout) */}
//             <Col xs={24} lg={8}>
//               <Space direction='vertical' style={{ width: '100%' }} size='large'>
//                 <CameraControls isConnected={isConnected} />
//                 <CaptureHistory images={capturedImages} />
//               </Space>
//             </Col>
//           </Row>
//         </div>
//       </Content>
//     </Layout>
//   );
// };

// export default RobotControlPage;

// -----------------

// src/pages/RobotControlPage.tsx

import React, { useState } from 'react';
import { Layout, Space, Typography, Row, Col, message } from 'antd';
import { CameraOutlined } from '@ant-design/icons';
import CameraFeed from '../components/CameraFeed';
import CameraControls from '../components/CameraControls';
import CaptureHistory from '../components/CaptureHistory';
import type { CapturedImage } from '../types/camera';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const RobotControlPage: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);

  const handleImageCaptured = (img: CapturedImage) => {
    setCapturedImages([img, ...capturedImages]);
    message.success('Image captured and uploaded successfully!');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}
      >
        <Space align='center' style={{ height: '100%' }}>
          <CameraOutlined style={{ fontSize: '28px', color: '#52c41a' }} />
          <Title level={3} style={{ margin: 0 }}>
            Smart Farm Monitoring System
          </Title>
        </Space>
      </Header>

      <Content
        style={{
          padding: '24px',
          overflow: 'auto',
          height: 'calc(100vh - 64px)',
        }}
      >
        <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
          <Text
            type='secondary'
            style={{ display: 'block', marginBottom: '24px', fontSize: '16px' }}
          >
            Real-time Intel RealSense D435 Camera Feed
          </Text>

          <Row gutter={[24, 24]}>
            {/* Camera Feed - Takes up 16 columns (2/3 of layout) */}
            <Col xs={24} lg={16}>
              <CameraFeed
                isConnected={isConnected}
                setIsConnected={setIsConnected}
                onImageCaptured={handleImageCaptured}
              />
            </Col>

            {/* Side Panel - Takes up 8 columns (1/3 of layout) */}
            <Col xs={24} lg={8}>
              <Space direction='vertical' style={{ width: '100%' }} size='large'>
                <CameraControls isConnected={isConnected} />
                <CaptureHistory images={capturedImages} />
              </Space>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default RobotControlPage;
