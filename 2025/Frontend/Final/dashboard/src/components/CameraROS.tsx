import { useState, useEffect } from 'react';
import { Card, Spin, Alert, Select, Space, Typography } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

interface CameraFeedProps {
  robotIp: string;
  topic?: string;
  streamType?: 'mjpeg' | 'vp8' | 'vp9';
  width?: string;
  maxWidth?: string;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  robotIp,
  topic = '/camera/rgb/image_raw',
  streamType = 'mjpeg',
  width = '100%',
  maxWidth = '800px',
}) => {
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>(topic);
  const [selectedType, setSelectedType] = useState<string>(streamType);

  const availableTopics = [
    '/camera/rgb/image_raw',
    '/camera/depth/image_raw',
    '/camera/ir/image_raw',
  ];

  useEffect(() => {
    const url = `http://${robotIp}:8080/stream?topic=${selectedTopic}&type=${selectedType}`;
    setStreamUrl(url);
    setIsLoading(true);
  }, [robotIp, selectedTopic, selectedType]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError('Failed to load camera stream. Check if web_video_server is running.');
  };

  return (
    <Card
      title={
        <Space>
          <VideoCameraOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Live Camera Feed
          </Title>
        </Space>
      }
      extra={
        <Space>
          <Select value={selectedTopic} onChange={setSelectedTopic} style={{ width: 200 }}>
            {availableTopics.map((t) => (
              <Option key={t} value={t}>
                {t.split('/').pop()}
              </Option>
            ))}
          </Select>
          <Select value={selectedType} onChange={setSelectedType} style={{ width: 100 }}>
            <Option value='mjpeg'>MJPEG</Option>
            <Option value='vp8'>VP8</Option>
            <Option value='vp9'>VP9</Option>
          </Select>
        </Space>
      }
    >
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size='large' tip='Loading camera stream...' />
        </div>
      )}

      {error && (
        <Alert
          message='Camera Error'
          description={error}
          type='error'
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      <div style={{ textAlign: 'center' }}>
        <img
          src={streamUrl}
          alt='Robot camera view'
          style={{
            width,
            maxWidth,
            display: error ? 'none' : 'block',
            margin: '0 auto',
            borderRadius: '8px',
            border: '2px solid #f0f0f0',
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    </Card>
  );
};
