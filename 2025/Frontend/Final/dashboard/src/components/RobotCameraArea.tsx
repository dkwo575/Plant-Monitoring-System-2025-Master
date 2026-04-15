import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Card,
  Button,
  Badge,
  Select,
  Slider,
  Row,
  Col,
  Space,
  Typography,
  Statistic,
  List,
  Image,
  message,
  Divider,
} from 'antd';
import {
  CameraOutlined,
  SettingOutlined,
  DownloadOutlined,
  PoweroffOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';

// camera feed Component

const CameraFeed: React.FC<CameraFeedProps> = ({
  isConnected,
  setIsConnected,
  onImageCaptured,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);

  useEffect(() => {
    const connectWebSocket = () => {
      // Replace with your actual WebSocket endpoint
      // wsRef.current = new WebSocket('ws://localhost:5000/video_feed');

      setIsConnected(true);
      simulateVideoFeed();
    };

    const simulateVideoFeed = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameCount = 0;
        const startTime = Date.now();

        const animate = () => {
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, '#1a472a');
          gradient.addColorStop(1, '#2d5a3d');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = '20px Arial';
          ctx.fillText('RealSense D435 Camera Feed', 20, 40);
          ctx.font = '14px Arial';
          ctx.fillText('Resolution: 1280x720 @ 15fps', 20, 70);
          ctx.fillText('Press SPACE or click Capture button', 20, 100);

          frameCount++;
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed > 1) {
            setFps(Math.round(frameCount / elapsed));
          }

          requestAnimationFrame(animate);
        };
        animate();
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [setIsConnected]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isConnected) {
        e.preventDefault();
        captureImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isConnected]);

  const captureImage = async () => {
    setIsCapturing(true);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('file', blob, `capture_${Date.now()}.png`);
        formData.append('client_id', 'realsense_client');
        formData.append('client_name', 'camera_laptop');

        try {
          const response = await fetch('http://localhost:5000/upload', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Image uploaded:', data);

            const imageUrl = canvas.toDataURL();
            onImageCaptured({
              id: Date.now(),
              url: imageUrl,
              timestamp: new Date().toISOString(),
            });
          } else {
            message.error('Failed to upload image');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          message.error('Error uploading image');
        }

        setIsCapturing(false);
      }, 'image/png');
    }
  };

  return (
    <Card
      title={
        <Space>
          <Badge status={isConnected ? 'success' : 'error'} />
          <span>Live Camera Feed</span>
        </Space>
      }
      extra={
        <Space>
          <Statistic title='FPS' value={fps} />
          <Badge
            status={isConnected ? 'processing' : 'default'}
            text={isConnected ? 'Connected' : 'Disconnected'}
          />
        </Space>
      }
    >
      <div
        style={{
          background: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          marginBottom: '16px',
        }}
      >
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            opacity: isCapturing ? 0.5 : 1,
            transition: 'opacity 0.2s',
          }}
        />
      </div>

      <Space style={{ width: '100%' }} direction='vertical'>
        <Button
          type='primary'
          size='large'
          icon={<CameraOutlined />}
          onClick={captureImage}
          disabled={!isConnected || isCapturing}
          loading={isCapturing}
          block
          style={{ height: '48px', fontSize: '16px' }}
        >
          {isCapturing ? 'Capturing...' : 'Capture Image (SPACE)'}
        </Button>
        <Text type='secondary' style={{ display: 'block', textAlign: 'center' }}>
          Press SPACE key or click the button to capture and upload image
        </Text>
      </Space>
    </Card>
  );
};
