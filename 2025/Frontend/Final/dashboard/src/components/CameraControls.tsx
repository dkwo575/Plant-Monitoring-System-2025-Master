// import React, { useState } from 'react';
// import { Card, Select, Slider, Space, Typography, Statistic, Row, Col, Divider } from 'antd';
// import { SettingOutlined } from '@ant-design/icons';
// import type { CameraControlsProps } from '../types';

// const { Text } = Typography;
// const { Option } = Select;

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

// export default CameraControls;

// --------------

// src/components/CameraControls.tsx

import React, { useState } from 'react';
import { Card, Select, Slider, Row, Col, Space, Typography, Statistic, Divider } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

interface CameraControlsProps {
  isConnected: boolean;
}

const CameraControls: React.FC<CameraControlsProps> = ({ isConnected }) => {
  const [resolution, setResolution] = useState<string>('1280x720');
  const [frameRate, setFrameRate] = useState<number>(15);

  return (
    <Card
      title={
        <Space>
          <SettingOutlined />
          <span>Camera Settings</span>
        </Space>
      }
    >
      <Space direction='vertical' style={{ width: '100%' }} size='middle'>
        <div>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
            Resolution
          </Text>
          <Select
            value={resolution}
            onChange={setResolution}
            disabled={!isConnected}
            style={{ width: '100%' }}
            size='large'
          >
            <Option value='640x480'>640 x 480</Option>
            <Option value='1280x720'>1280 x 720</Option>
            <Option value='1920x1080'>1920 x 1080</Option>
          </Select>
        </div>

        <div>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
            Frame Rate: {frameRate} FPS
          </Text>
          <Slider
            min={6}
            max={30}
            value={frameRate}
            onChange={setFrameRate}
            disabled={!isConnected}
            marks={{ 6: '6', 15: '15', 30: '30' }}
          />
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <Row gutter={16}>
          <Col span={12}>
            <Statistic
              title='Status'
              value={isConnected ? 'Active' : 'Inactive'}
              valueStyle={{ color: isConnected ? '#52c41a' : '#ff4d4f', fontSize: '16px' }}
            />
          </Col>
          <Col span={12}>
            <Statistic title='Device' value='D435' valueStyle={{ fontSize: '16px' }} />
          </Col>
        </Row>
      </Space>
    </Card>
  );
};

export default CameraControls;
