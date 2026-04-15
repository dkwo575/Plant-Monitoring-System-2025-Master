// import { useState } from 'react';
// import { Layout, Tabs, Input, Alert, Badge, Space, Typography } from 'antd';
// import {
//   RobotOutlined,
//   VideoCameraOutlined,
//   DashboardOutlined,
//   CompassOutlined,
// } from '@ant-design/icons';
// import { useRosConnection } from '../hooks/UseRosConnection';
// import { RobotControl } from '../components/TurtlebotControl';
// import { CameraFeed } from '../components/CameraROS';
// import { RobotStatus } from '../components/RobotStatus';
// import { NavigationControl } from '../components/NavigationControl';
// import { VirtualJoystick } from '../components/VirtualJoystick';

// const { Header, Content } = Layout;
// const { Title } = Typography;

// type TabKey = 'control' | 'camera' | 'status' | 'navigation';

// const TurtlebotPage: React.FC = () => {
//   const [robotIp, setRobotIp] = useState<string>('192.168.1.100');
//   const rosUrl = `ws://${robotIp}:9090`;
//   const { ros, connected, error } = useRosConnection(rosUrl);
//   const [activeTab, setActiveTab] = useState<TabKey>('control');

//   const tabItems = [
//     {
//       key: 'control' as TabKey,
//       label: (
//         <span>
//           <RobotOutlined />
//           Control
//         </span>
//       ),
//       children: (
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
//           <RobotControl robotIp={robotIp} />
//           <VirtualJoystick cmdVelTopic={null} />
//         </div>
//       ),
//     },
//     {
//       key: 'camera' as TabKey,
//       label: (
//         <span>
//           <VideoCameraOutlined />
//           Camera
//         </span>
//       ),
//       children: <CameraFeed robotIp={robotIp} />,
//     },
//     {
//       key: 'status' as TabKey,
//       label: (
//         <span>
//           <DashboardOutlined />
//           Status
//         </span>
//       ),
//       children: <RobotStatus ros={ros} connected={connected} />,
//     },
//     {
//       key: 'navigation' as TabKey,
//       label: (
//         <span>
//           <CompassOutlined />
//           Navigation
//         </span>
//       ),
//       children: <NavigationControl ros={ros} connected={connected} />,
//     },
//   ];

//   return (
//     <Layout style={{ minHeight: '100vh' }}>
//       <Header
//         style={{
//           background: '#fff',
//           padding: '0 24px',
//           boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//         }}
//       >
//         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
//           <RobotOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
//           <Title level={3} style={{ margin: 0 }}>
//             TurtleBot2 Farm Security Control
//           </Title>
//         </div>

//         <Space>
//           <Badge
//             status={connected ? 'success' : 'error'}
//             text={connected ? 'Connected' : 'Disconnected'}
//           />
//         </Space>
//       </Header>

//       <Content style={{ padding: '24px', background: '#f0f2f5', overflow: 'auto' }}>
//         <div style={{ marginBottom: '16px' }}>
//           <Space>
//             <span>Robot IP:</span>
//             <Input
//               style={{ width: '200px' }}
//               value={robotIp}
//               onChange={(e) => setRobotIp(e.target.value)}
//               placeholder='192.168.1.100'
//             />
//           </Space>
//         </div>

//         {error && (
//           <Alert
//             message='Connection Error'
//             description={error}
//             type='error'
//             showIcon
//             closable
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         <Tabs
//           activeKey={activeTab}
//           onChange={(key) => setActiveTab(key as TabKey)}
//           items={tabItems}
//           size='large'
//         />
//       </Content>
//     </Layout>
//   );
// };

// export default TurtlebotPage;

// ------------- version 2

// const { Header, Content } = Layout;
// const { Title } = Typography;

// type TabKey = 'control' | 'camera' | 'status' | 'navigation';

// const TurtlebotPage: React.FC = () => {
//   const [robotIp, setRobotIp] = useState<string>('10.74.33.238');
//   const { connected, loading, error, connectRobot, disconnectRobot } = useRosConnection();
//   const [activeTab, setActiveTab] = useState<TabKey>('control');

//   const handleConnect = async () => {
//     await connectRobot(robotIp);
//   };

//   const handleDisconnect = async () => {
//     await disconnectRobot();
//   };

//   const tabItems = [
//     {
//       key: 'control' as TabKey,
//       label: (
//         <span>
//           <RobotOutlined />
//           Control
//         </span>
//       ),
//       children: (
//         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
//           <RobotControl robotIp={robotIp} />
//           <VirtualJoystick cmdVelTopic={null} />
//         </div>
//       ),
//     },
//     {
//       key: 'camera' as TabKey,
//       label: (
//         <span>
//           <VideoCameraOutlined />
//           Camera
//         </span>
//       ),
//       children: <CameraFeed robotIp={robotIp} />,
//     },
//     {
//       key: 'status' as TabKey,
//       label: (
//         <span>
//           <DashboardOutlined />
//           Status
//         </span>
//       ),
//       children: <RobotStatus />,
//     },
//     {
//       key: 'navigation' as TabKey,
//       label: (
//         <span>
//           <CompassOutlined />
//           Navigation
//         </span>
//       ),
//       children: <NavigationControl />,
//     },
//   ];

//   return (
//     <Layout style={{ minHeight: '100vh' }}>
//       <Header
//         style={{
//           background: '#fff',
//           padding: '0 24px',
//           boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//         }}
//       >
//         <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
//           <RobotOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
//           <Title level={3} style={{ margin: 0 }}>
//             TurtleBot2 Farm Security Control
//           </Title>
//         </div>

//         <Space>
//           <Badge
//             status={connected ? 'success' : 'error'}
//             text={connected ? 'Connected' : 'Disconnected'}
//           />
//         </Space>
//       </Header>

//       <Content style={{ padding: '24px', background: '#f0f2f5' }}>
//         {/* Connection Panel */}
//         <div
//           style={{
//             marginBottom: '16px',
//             padding: '16px',
//             background: '#fff',
//             borderRadius: '8px',
//             boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
//           }}
//         >
//           <Space size='middle' wrap>
//             <span style={{ fontWeight: 'bold' }}>Robot IP:</span>
//             <Input
//               style={{ width: '200px' }}
//               value={robotIp}
//               onChange={(e) => setRobotIp(e.target.value)}
//               placeholder='192.168.1.100'
//               disabled={connected}
//             />
//             {!connected ? (
//               <Button
//                 type='primary'
//                 icon={<ApiOutlined />}
//                 onClick={handleConnect}
//                 loading={loading}
//               >
//                 Connect
//               </Button>
//             ) : (
//               <Button
//                 danger
//                 icon={<DisconnectOutlined />}
//                 onClick={handleDisconnect}
//                 loading={loading}
//               >
//                 Disconnect
//               </Button>
//             )}
//           </Space>
//         </div>

//         {/* Error Alert */}
//         {error && (
//           <Alert
//             message='Connection Error'
//             description={error}
//             type='error'
//             showIcon
//             closable
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         {/* Main Content Tabs */}
//         <Tabs
//           activeKey={activeTab}
//           onChange={(key) => setActiveTab(key as TabKey)}
//           items={tabItems}
//           size='large'
//         />
//       </Content>
//     </Layout>
//   );
// };

// export default TurtlebotPage;

// ================= version3================

// import { useState } from 'react';
// import { Layout, Tabs, Input, Alert, Badge, Space, Typography, Button } from 'antd';
// import {
//   RobotOutlined,
//   VideoCameraOutlined,
//   DashboardOutlined,
//   CompassOutlined,
//   ApiOutlined,
//   DisconnectOutlined,
//   InfoCircleOutlined,
// } from '@ant-design/icons';
// import { useRosConnection } from '../hooks/UseRosConnection';
// import { RobotControl } from '../components/TurtlebotControl';
// import { CameraFeed } from '../components/CameraROS';
// import { RobotStatus } from '../components/RobotStatus';
// import { NavigationControl } from '../components/NavigationControl';
// import { VirtualJoystick } from '../components/VirtualJoystick';
// import { useBackendAPI } from '../hooks/useBackendAPI';
// import { MapVisualizer } from '../components/MapVisualizer';
// import { KeyboardControl } from '../components/KeyboardControl';
// import { RosConnectionDiagnostic } from '../components/Rosconnectiondiagnostic';

// const { Header, Content } = Layout;
// const { Title } = Typography;

// const TurtlebotPage: React.FC = () => {
//   const [robotIp, setRobotIp] = useState<string>('10.88.114.238');
//   // const { connected, loading, error, connectRobot, disconnectRobot } = useBackendAPI();

//   const rosUrl = `ws://${robotIp}:9090`;

//   const { ros, connected: rosConnected } = useRosConnection(rosUrl);
//   const {
//     connected: backendConnected,
//     loading,
//     error,
//     connectRobot,
//     disconnectRobot,
//   } = useBackendAPI();

//   const [activeTab, setActiveTab] = useState<string>('control');

//   // const { ros, connected } = useRosConnection(rosUrl);

//   return (
//     <Layout style={{ height: '100vh', overflow: 'hidden' }}>
//       <Header
//         style={{
//           background: '#fff',
//           padding: '0 24px',
//           boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           flexShrink: 0,
//         }}
//       >
//         <div style={{ display: 'flex', alignItems: 'center', gap: '16px', overflow: 'hidden' }}>
//           <RobotOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
//           <Title level={3} style={{ margin: 0 }}>
//             TurtleBot2 Farm Security Control
//           </Title>
//         </div>
//         <Badge
//           status={backendConnected ? 'success' : 'error'}
//           text={backendConnected ? 'Connected' : 'Disconnected'}
//         />
//       </Header>

//       <Content style={{ padding: '24px', background: '#f0f2f5', overflow: 'auto' }}>
//         <div
//           style={{
//             marginBottom: '16px',
//             padding: '16px',
//             background: '#fff',
//             borderRadius: '8px',
//             overflow: 'auto',
//           }}
//         >
//           <Space size='middle' wrap>
//             <span style={{ fontWeight: 'bold' }}>Robot IP:</span>
//             <Input
//               style={{ width: '200px' }}
//               value={robotIp}
//               onChange={(e) => setRobotIp(e.target.value)}
//               placeholder='192.168.1.100'
//               disabled={rosConnected}
//             />
//             {!rosConnected ? (
//               <Button
//                 type='primary'
//                 icon={<ApiOutlined />}
//                 onClick={() => connectRobot(robotIp)}
//                 loading={loading}
//               >
//                 Connect
//               </Button>
//             ) : (
//               <Button
//                 danger
//                 icon={<DisconnectOutlined />}
//                 onClick={disconnectRobot}
//                 loading={loading}
//               >
//                 Disconnect
//               </Button>
//             )}
//           </Space>
//         </div>

//         {error && (
//           <Alert
//             message='Connection Error'
//             description={error}
//             type='error'
//             showIcon
//             closable
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         <Tabs
//           activeKey={activeTab}
//           onChange={setActiveTab}
//           size='large'
//           items={[
//             {
//               key: 'control',
//               label: (
//                 <span>
//                   <RobotOutlined />
//                   Control
//                 </span>
//               ),
//               children: (
//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
//                   <RobotControl />
//                   <VirtualJoystick />
//                   <div>
//                     {/* Additional controls or information can go here */}
//                     <KeyboardControl />
//                   </div>
//                 </div>
//               ),
//             },
//             {
//               key: 'camera',
//               label: (
//                 <span>
//                   <VideoCameraOutlined />
//                   Camera
//                 </span>
//               ),
//               children: <CameraFeed robotIp={robotIp} />,
//             },
//             {
//               key: 'status',
//               label: (
//                 <span>
//                   <DashboardOutlined />
//                   Status
//                 </span>
//               ),
//               children: <RobotStatus />,
//             },
//             {
//               key: 'navigation',
//               label: (
//                 <span>
//                   <CompassOutlined />
//                   Navigation
//                 </span>
//               ),
//               children: <NavigationControl />,
//             },
//             {
//               key: 'map Visualization',
//               label: (
//                 <span>
//                   <DashboardOutlined />
//                   Map Visualization
//                 </span>
//               ),
//               children: <MapVisualizer ros={ros} connected={rosConnected} />,
//             },
//             {
//               key: 'diagnostics',
//               label: (
//                 <span>
//                   <InfoCircleOutlined />
//                   Diagnostics
//                 </span>
//               ),
//               children: (
//                 <RosConnectionDiagnostic ros={ros} connected={rosConnected} robotIp={robotIp} />
//               ),
//             },
//           ]}
//         />
//       </Content>
//     </Layout>
//   );
// };

// export default TurtlebotPage;

// ================= version end================

import { useState } from 'react';
import { Layout, Tabs, Input, Alert, Badge, Space, Typography, Button } from 'antd';
import {
  RobotOutlined,
  VideoCameraOutlined,
  DashboardOutlined,
  CompassOutlined,
  ApiOutlined,
  DisconnectOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useRosConnection } from '../hooks/UseRosConnection';
import { RobotControl } from '../components/TurtlebotControl';
import { CameraFeed } from '../components/CameraROS';
import { RobotStatus } from '../components/RobotStatus';
import { NavigationControl } from '../components/NavigationControl';
import { VirtualJoystick } from '../components/VirtualJoystick';
import { useBackendAPI } from '../hooks/useBackendAPI';
import { MapVisualizer } from '../components/MapVisualizer';
import { KeyboardControl } from '../components/KeyboardControl';
import { RosConnectionDiagnostic } from '../components/Rosconnectiondiagnostic';

const { Header, Content } = Layout;
const { Title } = Typography;

const TurtlebotPage: React.FC = () => {
  const [robotIp, setRobotIp] = useState<string>('10.88.114.238');
  const rosUrl = `ws://${robotIp}:9090`;

  // ROS WebSocket connection
  const { ros, connected: rosConnected, error: rosError } = useRosConnection(rosUrl);

  // Backend API connection
  const {
    connected: backendConnected,
    loading,
    error: backendError,
    connectRobot,
    disconnectRobot,
  } = useBackendAPI();

  const [activeTab, setActiveTab] = useState<string>('control');

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', overflow: 'hidden' }}>
          <RobotOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
          <Title level={3} style={{ margin: 0 }}>
            TurtleBot2 Farm Security Control
          </Title>
        </div>
        <Space>
          <Badge
            status={backendConnected ? 'success' : 'error'}
            text={`Backend: ${backendConnected ? 'Connected' : 'Disconnected'}`}
          />
          <Badge
            status={rosConnected ? 'success' : 'error'}
            text={`ROS: ${rosConnected ? 'Connected' : 'Disconnected'}`}
          />
        </Space>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5', overflow: 'auto' }}>
        <div
          style={{
            marginBottom: '16px',
            padding: '16px',
            background: '#fff',
            borderRadius: '8px',
            overflow: 'auto',
          }}
        >
          <Space size='middle' wrap>
            <span style={{ fontWeight: 'bold' }}>Robot IP:</span>
            <Input
              style={{ width: '200px' }}
              value={robotIp}
              onChange={(e) => setRobotIp(e.target.value)}
              placeholder='192.168.1.100'
              disabled={backendConnected}
            />
            {!backendConnected ? (
              <Button
                type='primary'
                icon={<ApiOutlined />}
                onClick={() => connectRobot(robotIp)}
                loading={loading}
              >
                Connect
              </Button>
            ) : (
              <Button
                danger
                icon={<DisconnectOutlined />}
                onClick={disconnectRobot}
                loading={loading}
              >
                Disconnect
              </Button>
            )}
          </Space>
        </div>

        {backendError && (
          <Alert
            message='Backend Connection Error'
            description={backendError}
            type='error'
            showIcon
            closable
            style={{ marginBottom: '16px' }}
          />
        )}

        {rosError && (
          <Alert
            message='ROS Connection Error'
            description={rosError}
            type='warning'
            showIcon
            closable
            style={{ marginBottom: '16px' }}
          />
        )}

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size='large'
          items={[
            {
              key: 'diagnostics',
              label: (
                <span>
                  <ToolOutlined />
                  Diagnostics
                </span>
              ),
              children: (
                <RosConnectionDiagnostic ros={ros} connected={rosConnected} robotIp={robotIp} />
              ),
            },
            {
              key: 'control',
              label: (
                <span>
                  <RobotOutlined />
                  Control
                </span>
              ),
              children: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <RobotControl />
                  <VirtualJoystick />
                  <div>
                    <KeyboardControl />
                  </div>
                </div>
              ),
            },
            {
              key: 'camera',
              label: (
                <span>
                  <VideoCameraOutlined />
                  Camera
                </span>
              ),
              children: <CameraFeed robotIp={robotIp} />,
            },
            {
              key: 'status',
              label: (
                <span>
                  <DashboardOutlined />
                  Status
                </span>
              ),
              children: <RobotStatus />,
            },
            {
              key: 'navigation',
              label: (
                <span>
                  <CompassOutlined />
                  Navigation
                </span>
              ),
              children: <NavigationControl />,
            },
            {
              key: 'map',
              label: (
                <span>
                  <DashboardOutlined />
                  Map Visualization
                </span>
              ),
              children: <MapVisualizer ros={ros} connected={rosConnected} />,
            },
          ]}
        />
      </Content>
    </Layout>
  );
};

export default TurtlebotPage;
// === version 4================

// import React, { useState } from 'react';
// import { Layout, Tabs, Typography, Input, Space } from 'antd';
// import {
//   RobotOutlined,
//   VideoCameraOutlined,
//   DashboardOutlined,
//   CompassOutlined,
// } from '@ant-design/icons';
// import { useRosConnection } from '../hooks/UseRosConnection';
// import { RobotControl } from '../components/TurtlebotControl';
// import { CameraFeed } from '../components/CameraROS';
// import { RobotStatus } from '../components/RobotStatus';
// import { NavigationControl } from '../components/NavigationControl';
// import { MapVisualizer } from '../components/MapVisualizer';
// import { VirtualJoystick } from '../components/VirtualJoystick';
// import { KeyboardControl } from '../components/KeyboardControl';

// const { Content } = Layout;
// const { Title } = Typography;

// const TurtlebotPage: React.FC = () => {
//   // ---------------------------------------------------------
//   // 1. STEP ONE: Define State and Hooks
//   // ---------------------------------------------------------
//   const [robotIp, setRobotIp] = useState<string>('192.168.1.100');
//   const rosUrl = `ws://${robotIp}:9090`;

//   const { ros, connected, error } = useRosConnection(rosUrl);

//   // ---------------------------------------------------------
//   // 2. STEP TWO: Define the Tabs List
//   // ---------------------------------------------------------
//   const items = [
//     {
//       key: 'control',
//       label: (
//         <span>
//           <RobotOutlined /> Control
//         </span>
//       ),
//       children: (
//         <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
//           <RobotControl robotIp={robotIp} />
//           <div style={{ marginTop: '20px' }}>
//             <VirtualJoystick cmdVelTopic={null} />
//           </div>
//           <div style={{ marginTop: '20px' }}>
//             <KeyboardControl />
//           </div>
//         </div>
//       ),
//     },
//     {
//       key: 'camera',
//       label: (
//         <span>
//           <VideoCameraOutlined /> Camera
//         </span>
//       ),
//       children: <CameraFeed robotIp={robotIp} />,
//     },
//     {
//       key: 'status',
//       label: (
//         <span>
//           <DashboardOutlined /> Status
//         </span>
//       ),
//       children: <RobotStatus ros={ros} connected={connected} />,
//     },
//     {
//       key: 'navigation',
//       label: (
//         <span>
//           <CompassOutlined /> Navigation
//         </span>
//       ),
//       children: <NavigationControl />,
//     },
//     {
//       key: 'map Visualization',
//       label: (
//         <span>
//           <DashboardOutlined /> Map Visualization
//         </span>
//       ),
//       children: <MapVisualizer />,
//     },
//   ];

//   // ---------------------------------------------------------
//   // 3. STEP THREE: Render
//   // ---------------------------------------------------------
//   return (
//     // CHANGE 1: Set Layout height to fixed 100vh (full screen)
//     <Layout style={{ height: '100vh', overflow: 'hidden' }}>
//       {/* CHANGE 2: Add overflowY: 'auto' to make just this content area scrollable */}
//       <Content style={{ padding: '20px', overflowY: 'auto', height: '100%' }}>
//         <Title level={2} style={{ textAlign: 'center' }}>
//           Turtlebot Control Panel
//         </Title>

//         <div style={{ maxWidth: '400px', margin: '0 auto 20px', textAlign: 'center' }}>
//           <Space direction='vertical' style={{ width: '100%' }}>
//             <Input
//               addonBefore='Robot IP'
//               value={robotIp}
//               onChange={(e) => setRobotIp(e.target.value)}
//             />
//             <div style={{ color: connected ? 'green' : 'red', fontWeight: 'bold' }}>
//               Status: {connected ? 'Connected' : 'Disconnected'}
//             </div>
//             {error && <div style={{ color: 'red' }}>{error}</div>}
//           </Space>
//         </div>

//         <Tabs defaultActiveKey='control' items={items} centered />
//       </Content>
//     </Layout>
//   );
// };

// export default TurtlebotPage;
