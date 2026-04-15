// import React from 'react';
// import { Card, Badge, Space, List, Image, Typography } from 'antd';
// import { DownloadOutlined, CloudUploadOutlined } from '@ant-design/icons';
// import type { CaptureHistoryProps } from '../types';

// const { Text } = Typography;

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

// export default CaptureHistory;

// --------------

// src/components/CaptureHistory.tsx

import React from 'react';
import { Card, Badge, List, Image, Space, Typography } from 'antd';
import { DownloadOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { CapturedImage } from '../types/camera';

const { Text } = Typography;

interface CaptureHistoryProps {
  images: CapturedImage[];
}

const CaptureHistory: React.FC<CaptureHistoryProps> = ({ images }) => {
  return (
    <Card
      title={
        <Space>
          <DownloadOutlined />
          <span>Recent Captures</span>
          <Badge count={images.length} showZero style={{ backgroundColor: '#52c41a' }} />
        </Space>
      }
    >
      {images.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type='secondary'>No captures yet. Press SPACE to capture.</Text>
        </div>
      ) : (
        <List
          dataSource={images}
          style={{ maxHeight: '400px', overflow: 'auto' }}
          renderItem={(item) => (
            <List.Item style={{ padding: '12px 0' }}>
              <Card
                hoverable
                size='small'
                style={{ width: '100%' }}
                cover={
                  <Image
                    src={item.url}
                    alt='Captured'
                    style={{ height: '120px', objectFit: 'cover' }}
                    preview={{
                      mask: <CloudUploadOutlined style={{ fontSize: '24px' }} />,
                    }}
                  />
                }
              >
                <Card.Meta
                  description={
                    <Text type='secondary' style={{ fontSize: '12px' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default CaptureHistory;
