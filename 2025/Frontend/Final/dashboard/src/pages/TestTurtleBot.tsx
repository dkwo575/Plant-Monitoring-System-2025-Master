// import React, { useState } from 'react';
// import { Button, Layout, Space, Typography, Card, Alert, Spin } from 'antd';
// import {
//   ArrowUpOutlined,
//   ArrowDownOutlined,
//   ArrowLeftOutlined,
//   ArrowRightOutlined,
//   StopOutlined,
// } from '@ant-design/icons';

// const { Header, Content, Footer } = Layout;
// const { Title, Text } = Typography;

// // ----------------- IMPORTANT -----------------
// //
// //      CHANGE THIS IP TO YOUR ROS COMPUTER'S IP
// //
// const BACKEND_URL = 'http://localhost:5000/control';
// //
// // ---------------------------------------------
// //

// type Direction = 'forward' | 'backward' | 'left' | 'right' | 'stop';

// const TestTurtleBot: React.FC = () => {
//   const [loading, setLoading] = useState(false);
//   const [status, setStatus] = useState<{
//     type: 'info' | 'success' | 'error';
//     message: string;
//   }>({ type: 'info', message: 'Ready to send commands.' });

//   /**
//    * Sends the control command to the Flask backend.
//    */
//   const sendCommand = async (direction: Direction) => {
//     setLoading(true);
//     setStatus({ type: 'info', message: `Sending command: ${direction}...` });

//     try {
//       const response = await fetch(BACKEND_URL, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ direction }),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`);
//       }

//       const data = await response.json();

//       if (data.status === 'success') {
//         setStatus({
//           type: 'success',
//           message: `Command sent: ${data.command}`,
//         });
//       } else {
//         throw new Error(data.message || 'Unknown backend error');
//       }
//     } catch (error) {
//       console.error('Failed to send command:', error);
//       let errorMessage = 'Failed to connect to the robot.';
//       if (error instanceof Error) {
//         errorMessage = error.message;
//       }
//       if (errorMessage.includes('Failed to fetch')) {
//         errorMessage = `Could not connect to backend at ${BACKEND_URL}. Is it running? Is the IP correct?`;
//       }
//       setStatus({
//         type: 'error',
//         message: errorMessage,
//       });
//     } finally {
//       setLoading(false);

//       // If the command was not 'stop', send a 'stop' command after a short delay
//       // to prevent the robot from moving continuously.
//       // For this test, we stop it immediately.
//       // For real use, you might want a "press and hold" model.
//       if (direction !== 'stop') {
//         setTimeout(() => sendCommand('stop'), 300); // Stop after 300ms
//       }
//     }
//   };

//   return (
//     <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
//       <Header style={{ backgroundColor: '#fff', textAlign: 'center' }}>
//         <Title level={2} style={{ margin: '14px 0' }}>
//           TurtleBot 2 Web Controller
//         </Title>
//       </Header>
//       <Content
//         style={{
//           display: 'flex',
//           justifyContent: 'center',
//           alignItems: 'center',
//           padding: '48px',
//         }}
//       >
//         <Spin spinning={loading} tip='Sending...'>
//           <Card title='Robot Control Pad' style={{ width: 400, textAlign: 'center' }} bordered>
//             <Space direction='vertical' size='large' style={{ width: '100%' }}>
//               {/* Status Alert */}
//               <Alert message={status.message} type={status.type} showIcon />

//               {/* Forward Button */}
//               <Button
//                 type='primary'
//                 icon={<ArrowUpOutlined />}
//                 size='large'
//                 block
//                 onClick={() => sendCommand('forward')}
//                 disabled={loading}
//               >
//                 Forward
//               </Button>

//               {/* Middle Row: Left, Stop, Right */}
//               <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
//                 <Button
//                   type='default'
//                   icon={<ArrowLeftOutlined />}
//                   size='large'
//                   style={{ width: 110 }}
//                   onClick={() => sendCommand('left')}
//                   disabled={loading}
//                 >
//                   Left
//                 </Button>
//                 <Button
//                   type='primary'
//                   danger
//                   icon={<StopOutlined />}
//                   size='large'
//                   style={{ width: 110 }}
//                   onClick={() => sendCommand('stop')}
//                   disabled={loading}
//                 >
//                   Stop
//                 </Button>
//                 <Button
//                   type='default'
//                   icon={<ArrowRightOutlined />}
//                   size='large'
//                   style={{ width: 110 }}
//                   onClick={() => sendCommand('right')}
//                   disabled={loading}
//                 >
//                   Right
//                 </Button>
//               </Space>

//               {/* Backward Button */}
//               <Button
//                 type='primary'
//                 icon={<ArrowDownOutlined />}
//                 size='large'
//                 block
//                 onClick={() => sendCommand('backward')}
//                 disabled={loading}
//               >
//                 Backward
//               </Button>

//               <Text type='secondary'>Note: Robot stops automatically after each move.</Text>
//             </Space>
//           </Card>
//         </Spin>
//       </Content>
//       <Footer style={{ textAlign: 'center', backgroundColor: '#f0f2f5' }}>
//         React + Flask + ROS ©2025
//       </Footer>
//     </Layout>
//   );
// };

// export default TestTurtleBot;

// ========== version 2 ==================

import React, { useState } from 'react';
import { Layout, Button, Space, Typography, Card, Row, Col, message } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  StopOutlined,
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

// --- CONFIGURATION ---
const BACKEND_URL = 'http://localhost:5000/control';
// ---

const App: React.FC = () => {
  // We no longer need a single 'loading' state.
  // 'lastCommand' is still useful for UI feedback.
  const [lastCommand, setLastCommand] = useState('None');
  const [rosStatus, setRosStatus] = useState<'connected' | 'error' | 'idle'>('idle');

  /**
   * Sends a single, specific command to the backend.
   * This is now the core function used by event handlers.
   */
  const sendCommand = async (direction: string) => {
    // Don't set loading here, as it's not a single "click"
    setLastCommand(direction.charAt(0).toUpperCase() + direction.slice(1));

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction: direction }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        // We don't want a success message on *every* command,
        // as it would be too noisy. We'll just set the status.
        if (rosStatus !== 'connected') setRosStatus('connected');
      } else {
        throw new Error(data.message || 'Backend error');
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
      message.error(`Failed to send command: ${error.message}`);
      setRosStatus('error');
    }
    // No 'finally' block to set loading to false.
  };

  /**
   * Handles "press and hold" events.
   * Sends the move command on press (onMouseDown / onTouchStart).
   */
  const handlePress = (direction: string) => {
    console.log('Press:', direction);
    sendCommand(direction);
  };

  /**
   * Handles "release" events.
   * Sends the 'stop' command on release (onMouseUp / onMouseLeave / onTouchEnd).
   */
  const handleRelease = () => {
    console.log('Release: stop');
    sendCommand('stop');
  };

  return (
    <Layout className='min-h-screen font-sans'>
      <Header className='bg-blue-600 shadow-md'>
        <Title level={2} className='text-white leading-[64px] m-0'>
          TurtleBot 2 Web Controller
        </Title>
      </Header>

      <Content className='p-4 md:p-8'>
        <Row justify='center'>
          <Col xs={24} sm={20} md={16} lg={12} xl={10}>
            <Card
              title='Robot Control Panel (Hold-to-Move)'
              bordered={false}
              className='shadow-lg rounded-lg select-none' // 'select-none' prevents text selection
              headStyle={{ backgroundColor: '#f0f2f5', borderBottom: '1px solid #d9d9d9' }}
            >
              <Space direction='vertical' size='large' className='w-full'>
                {/* Control Buttons - NOW WITH onMouseDown/onMouseUp */}
                <Row justify='center'>
                  <Col>
                    <Button
                      type='primary'
                      icon={<ArrowUpOutlined />}
                      size='large'
                      className='w-24 h-24 text-3xl'
                      onMouseDown={() => handlePress('forward')}
                      onMouseUp={handleRelease}
                      onMouseLeave={handleRelease} // Stop if mouse leaves button
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handlePress('forward');
                      }} // For mobile
                      onTouchEnd={handleRelease}
                      aria-label='Move Forward'
                    />
                  </Col>
                </Row>

                <Row justify='center' gutter={16}>
                  <Col>
                    <Button
                      type='primary'
                      icon={<ArrowLeftOutlined />}
                      size='large'
                      className='w-24 h-24 text-3xl'
                      onMouseDown={() => handlePress('left')}
                      onMouseUp={handleRelease}
                      onMouseLeave={handleRelease}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handlePress('left');
                      }}
                      onTouchEnd={handleRelease}
                      aria-label='Move Left'
                    />
                  </Col>
                  <Col>
                    {/* The Stop button remains an onClick */}
                    <Button
                      danger
                      type='primary'
                      icon={<StopOutlined />}
                      size='large'
                      className='w-24 h-24 text-3xl'
                      onClick={() => sendCommand('stop')}
                      aria-label='Stop'
                    />
                  </Col>
                  <Col>
                    <Button
                      type='primary'
                      icon={<ArrowRightOutlined />}
                      size='large'
                      className='w-24 h-24 text-3xl'
                      onMouseDown={() => handlePress('right')}
                      onMouseUp={handleRelease}
                      onMouseLeave={handleRelease}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handlePress('right');
                      }}
                      onTouchEnd={handleRelease}
                      aria-label='Move Right'
                    />
                  </Col>
                </Row>

                <Row justify='center'>
                  <Col>
                    <Button
                      type='primary'
                      icon={<ArrowDownOutlined />}
                      size='large'
                      className='w-24 h-24 text-3xl'
                      onMouseDown={() => handlePress('backward')}
                      onMouseUp={handleRelease}
                      onMouseLeave={handleRelease}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        handlePress('backward');
                      }}
                      onTouchEnd={handleRelease}
                      aria-label='Move Backward'
                    />
                  </Col>
                </Row>

                {/* Status Indicator */}
                <Row justify='center' className='mt-4'>
                  <Col>
                    <Text strong>Last Command:</Text> {lastCommand}
                    <span
                      className={`ml-4 px-2 py-1 rounded-full text-xs text-white ${
                        rosStatus === 'connected'
                          ? 'bg-green-500'
                          : rosStatus === 'error'
                          ? 'bg-red-500'
                          : 'bg-gray-400'
                      }`}
                    >
                      {rosStatus.toUpperCase()}
                    </span>
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>

      <Footer className='text-center text-gray-500'>TurtleBot Controller ©2025</Footer>
    </Layout>
  );
};

export default App;
