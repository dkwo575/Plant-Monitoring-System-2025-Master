import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Space, Typography } from 'antd';
import {
  ThunderboltOutlined,
  DashboardOutlined,
  SyncOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import type { RosInstance, TopicInstance } from '../types/roslib';

const { Title } = Typography;

interface BatteryState {
  percentage: number;
  voltage: number;
  current: number;
}

interface RobotStatusProps {
  ros: RosInstance | null;
  connected: boolean;
}

export const RobotStatus: React.FC<RobotStatusProps> = ({ ros, connected }) => {
  const [battery, setBattery] = useState<BatteryState>({ percentage: 0, voltage: 0, current: 0 });
  const [speed, setSpeed] = useState<{ linear: number; angular: number }>({
    linear: 0,
    angular: 0,
  });

  useEffect(() => {
    if (!ros || !connected || !window.ROSLIB) return;

    // Subscribe to battery state
    const batteryTopic = new window.ROSLIB.Topic({
      ros: ros,
      name: '/mobile_base/sensors/core',
      messageType: 'kobuki_msgs/SensorState',
    });

    batteryTopic.subscribe((message: any) => {
      setBattery({
        percentage: message.battery || 0,
        voltage: message.voltage || 0,
        current: message.current || 0,
      });
    });

    // Subscribe to velocity commands
    const cmdVelTopic = new window.ROSLIB.Topic({
      ros: ros,
      name: '/cmd_vel',
      messageType: 'geometry_msgs/Twist',
    });

    cmdVelTopic.subscribe((message: any) => {
      setSpeed({
        linear: message.linear.x,
        angular: message.angular.z,
      });
    });

    return () => {
      batteryTopic.unsubscribe();
      cmdVelTopic.unsubscribe();
    };
  }, [ros, connected]);

  const getBatteryStatus = (percentage: number): 'success' | 'exception' | 'normal' => {
    if (percentage > 60) return 'success';
    if (percentage > 30) return 'normal';
    return 'exception';
  };

  return (
    <Space direction='vertical' size='large' style={{ width: '100%' }}>
      <Card>
        <Title level={4}>Battery Status</Title>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Progress
              percent={battery.percentage}
              status={getBatteryStatus(battery.percentage)}
              strokeWidth={20}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Statistic
              title='Voltage'
              value={battery.voltage.toFixed(2)}
              suffix='V'
              prefix={<ThunderboltOutlined />}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Statistic
              title='Current'
              value={battery.current.toFixed(2)}
              suffix='A'
              prefix={<ApiOutlined />}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Title level={4}>Movement Status</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Statistic
              title='Linear Speed'
              value={speed.linear.toFixed(3)}
              suffix='m/s'
              prefix={<DashboardOutlined />}
              valueStyle={{ color: Math.abs(speed.linear) > 0 ? '#3f8600' : '#999' }}
            />
          </Col>
          <Col xs={24} sm={12}>
            <Statistic
              title='Angular Speed'
              value={speed.angular.toFixed(3)}
              suffix='rad/s'
              prefix={<SyncOutlined />}
              valueStyle={{ color: Math.abs(speed.angular) > 0 ? '#3f8600' : '#999' }}
            />
          </Col>
        </Row>
      </Card>
    </Space>
  );
};
// ```)}
//           </span>
//         </div>
//         <div className="status-item">
//           <label>Voltage:</label>
//           <span>{battery.voltage.toFixed(2)}V</span>
//         </div>
//         <div className="status-item">
//           <label>Linear Speed:</label>
//           <span>{speed.linear.toFixed(2)} m/s</span>
//         </div>
//         <div className="status-item">
//           <label>Angular Speed:</label>
//           <span>{speed.angular.toFixed(2)} rad/s</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// ========= version 2 ==========

// import { Card, Row, Col, Statistic, Progress, Space, Typography } from 'antd';
// import {
//   ThunderboltOutlined,
//   DashboardOutlined,
//   SyncOutlined,
//   ApiOutlined
// } from '@ant-design/icons';
// import { useBackendAPI } from '../hooks/useBackendAPI';

// const { Title } = Typography;

// export const RobotStatus: React.FC = () => {
//   const { robotStatus } = useBackendAPI();

//   const battery = robotStatus?.battery || { percentage: 0, voltage: 0, current: 0 };
//   const velocity = robotStatus?.velocity || { linear: 0, angular: 0 };

//   const getBatteryStatus = (percentage: number): 'success' | 'exception' | 'normal' => {
//     if (percentage > 60) return 'success';
//     if (percentage > 30) return 'normal';
//     return 'exception';
//   };

//   return (
//     <Space direction="vertical" size="large" style={{ width: '100%' }}>
//       <Card>
//         <Title level={4}>Battery Status</Title>
//         <Row gutter={[16, 16]}>
//           <Col span={24}>
//             <Progress
//               percent={battery.percentage}
//               status={getBatteryStatus(battery.percentage)}
//               strokeWidth={20}
//             />
//           </Col>
//           <Col xs={24} sm={12}>
//             <Statistic
//               title="Voltage"
//               value={battery.voltage.toFixed(2)}
//               suffix="V"
//               prefix={<ThunderboltOutlined />}
//             />
//           </Col>
//           <Col xs={24} sm={12}>
//             <Statistic
//               title="Current"
//               value={battery.current.toFixed(2)}
//               suffix="A"
//               prefix={<ApiOutlined />}
//             />
//           </Col>
//         </Row>
//       </Card>

//       <Card>
//         <Title level={4}>Movement Status</Title>
//         <Row gutter={[16, 16]}>
//           <Col xs={24} sm={12}>
//             <Statistic
//               title="Linear Speed"
//               value={velocity.linear.toFixed(3)}
//               suffix="m/s"
//               prefix={<DashboardOutlined />}
//               valueStyle={{ color: Math.abs(velocity.linear) > 0 ? '#3f8600' : '#999' }}
//             />
//           </Col>
//           <Col xs={24} sm={12}>
//             <Statistic
//               title="Angular Speed"
//               value={velocity.angular.toFixed(3)}
//               suffix="rad/s"
//               prefix={<SyncOutlined />}
//               valueStyle={{ color: Math.abs(velocity.angular) > 0 ? '#3f8600' : '#999' }}
//             />
//           </Col>
//         </Row>
//       </Card>
//     </Space>
//   );
// };
