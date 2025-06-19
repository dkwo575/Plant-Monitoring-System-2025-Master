// // You'll need these dependencies:
// // npm install antd react-router-dom socket.io-client
// import React, { useState, useEffect, useRef, createContext, useState, useContext } from 'react';
// import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
// import { io, Socket } from 'socket.io-client';
// import {
//   Layout,
//   Form,
//   Input,
//   Button,
//   Card,
//   Col,
//   Row,
//   Statistic,
//   Typography,
//   notification,
//   List,
//   Tag,
// } from 'antd';
// import {
//   PoweroffOutlined,
//   MessageOutlined,
//   BulbOutlined,
//   FireOutlined,
//   CloudOutlined,
// } from '@ant-design/icons';
// // import 'antd/dist/antd.css'; // Import Ant Design styles
// // import { MaterialSymbol } from 'react-material-symbols';

// const { Header, Content, Footer } = Layout;
// const { Title, Text } = Typography;

// // --- Authentication State ---
// // In a real app, use React Context or a state management library like Redux/Zustand
// let isAuthenticated = false;

// // --- Login Page Component ---
// const LoginPage = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);

//   const onFinish = async (values) => {
//     setLoading(true);
//     try {
//       const response = await fetch('http://localhost:5001/api/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(values),
//       });
//       if (response.ok) {
//         notification.success({ message: 'Login Successful' });
//         isAuthenticated = true;
//         navigate('/admin');
//       } else {
//         notification.error({
//           message: 'Login Failed',
//           description: 'Invalid username or password.',
//         });
//       }
//     } catch (error) {
//       notification.error({ message: 'Error', description: 'Could not connect to the server.' });
//     }
//     setLoading(false);
//   };

//   return (
//     <div
//       style={{
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//         height: '100vh',
//         background: '#f0f2f5',
//       }}
//     >
//       <Card title='Admin Login' style={{ width: 350 }}>
//         <Form name='login' onFinish={onFinish}>
//           <Form.Item
//             name='username'
//             rules={[{ required: true, message: 'Please input your Username!' }]}
//           >
//             <Input placeholder='Username (admin)' />
//           </Form.Item>
//           <Form.Item
//             name='password'
//             rules={[{ required: true, message: 'Please input your Password!' }]}
//           >
//             <Input.Password placeholder='Password (password123)' />
//           </Form.Item>
//           <Form.Item>
//             <Button type='primary' htmlType='submit' loading={loading} block>
//               Log In
//             </Button>
//           </Form.Item>
//         </Form>
//       </Card>
//     </div>
//   );
// };

// // --- Protected Route ---
// const PrivateRoute = ({ children }) => {
//   return isAuthenticated ? children : <Navigate to='/' />;
// };

// // --- Admin Dashboard Component ---
// type Rule = {
//   sensor: string;
//   operator: string;
//   value: string | number;
//   action: string;
// };

// const AdminDashboard = () => {
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [state, setState] = useState<{ sensors: any; motor_on: boolean }>({
//     sensors: {},
//     motor_on: false,
//   });
//   const [chatInput, setChatInput] = useState('');
//   const [rules, setRules] = useState<Rule[]>([]);
//   const [chatMessages, setChatMessages] = useState<{ type: 'user' | 'system'; text: string }[]>([]);

//   // Effect for Socket.IO connection and event listeners
//   useEffect(() => {
//     // Connect to the backend
//     const newSocket = io('http://localhost:5001');
//     setSocket(newSocket);

//     newSocket.on('connect', () => {
//       console.log('Connected to server!');
//       notification.success({ message: 'Connected to server' });
//     });

//     // Listen for full state updates
//     newSocket.on('state_update', (newState) => {
//       console.log('Received state update:', newState);
//       setState(newState);
//     });

//     // Listen for rules updates
//     newSocket.on('rules_update', (newRules) => {
//       console.log('Received rules update:', newRules);
//       setRules(newRules);
//     });

//     // Listen for general notifications
//     newSocket.on('notification', (data) => {
//       notification.info({
//         message: 'System Notification',
//         description: data.message,
//       });
//       setChatMessages((prev) => [...prev, { type: 'system', text: data.message }]);
//     });

//     // Cleanup on component unmount
//     return () => {
//       newSocket.disconnect();
//     };
//   }, []);

//   const handleMotorToggle = (action: string) => {
//     if (socket) {
//       socket.emit('direct_command', { action });
//     }
//   };

//   const handleChatSubmit = () => {
//     if (socket && chatInput.trim()) {
//       setChatMessages((prev) => [...prev, { type: 'user', text: chatInput }]);
//       socket.emit('control_command', { text: chatInput });
//       setChatInput('');
//     }
//   };

//   return (
//     <Layout>
//       <Header style={{ color: 'white' }}>IoT Control Panel</Header>
//       <Content style={{ padding: '24px 50px' }}>
//         <Title level={2}>Device Status</Title>
//         <Row gutter={16}>
//           <Col span={6}>
//             <Card>
//               <Statistic
//                 title='Temperature'
//                 value={state.sensors.temperature ?? 'N/A'}
//                 precision={1}
//                 prefix={<FireOutlined />}
//                 suffix='°C'
//               />
//             </Card>
//           </Col>
//           <Col span={6}>
//             <Card>
//               <Statistic
//                 title='Humidity'
//                 value={state.sensors.humidity ?? 'N/A'}
//                 precision={1}
//                 prefix={<CloudOutlined />}
//                 suffix='%'
//               />
//             </Card>
//           </Col>
//           <Col span={6}>
//             <Card>
//               <Statistic
//                 title='Light Level'
//                 value={state.sensors.light ?? 'N/A'}
//                 prefix={<BulbOutlined />}
//                 suffix='lx'
//               />
//             </Card>
//           </Col>
//           <Col span={6}>
//             <Card>
//               <Statistic
//                 title='Motor Status'
//                 value={state.motor_on ? 'ON' : 'OFF'}
//                 valueStyle={{ color: state.motor_on ? '#3f8600' : '#cf1322' }}
//               />
//             </Card>
//           </Col>
//         </Row>

//         <Row gutter={24} style={{ marginTop: 24 }}>
//           <Col span={12}>
//             <Card title='Direct Control'>
//               <Button
//                 type='primary'
//                 icon={<PoweroffOutlined />}
//                 size='large'
//                 onClick={() => handleMotorToggle('turn_on_motor')}
//                 disabled={state.motor_on}
//                 style={{ marginRight: 16 }}
//               >
//                 Turn Motor ON
//               </Button>
//               <Button
//                 type='primary'
//                 danger
//                 icon={<PoweroffOutlined />}
//                 size='large'
//                 onClick={() => handleMotorToggle('turn_off_motor')}
//                 disabled={!state.motor_on}
//               >
//                 Turn Motor OFF
//               </Button>
//             </Card>
//             <Card title='Active Rules' style={{ marginTop: 24 }}>
//               <List
//                 bordered
//                 dataSource={rules}
//                 renderItem={(item) => (
//                   <List.Item>
//                     <Text code>
//                       IF {item.sensor} {item.operator} {item.value} THEN{' '}
//                       {item.action.replace('_', ' ')}
//                     </Text>
//                   </List.Item>
//                 )}
//                 locale={{ emptyText: 'No rules set.' }}
//               />
//             </Card>
//           </Col>
//           <Col span={12}>
//             <Card title='Control via Chat' headStyle={{ backgroundColor: '#e6f7ff' }}>
//               <div
//                 style={{
//                   height: 300,
//                   overflowY: 'auto',
//                   border: '1px solid #d9d9d9',
//                   padding: 8,
//                   marginBottom: 8,
//                   borderRadius: '4px',
//                 }}
//               >
//                 {chatMessages.map((msg, i) => (
//                   <p key={i} style={{ textAlign: msg.type === 'user' ? 'right' : 'left' }}>
//                     <Tag color={msg.type === 'user' ? 'blue' : 'green'}>{msg.text}</Tag>
//                   </p>
//                 ))}
//               </div>
//               <Input.Search
//                 placeholder="e.g., 'turn on the motor if temperature is below 25'"
//                 enterButton='Send'
//                 size='large'
//                 value={chatInput}
//                 onChange={(e) => setChatInput(e.target.value)}
//                 onSearch={handleChatSubmit}
//                 prefix={<MessageOutlined />}
//               />
//             </Card>
//           </Col>
//         </Row>
//       </Content>
//       <Footer style={{ textAlign: 'center' }}>IoT LLM Control ©2024</Footer>
//     </Layout>
//   );
// };

// // --- Main App Component ---
// export default function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path='/' element={<LoginPage />} />
//         <Route
//           path='/admin'
//           element={
//             <PrivateRoute>
//               <AdminDashboard />
//             </PrivateRoute>
//           }
//         />
//       </Routes>
//     </Router>
//   );
// }

// ------------------------- Version 2------------------

// src/pages/AdministrationPage.tsx
import React, { useState } from 'react';
import { Input, Button, Card, message } from 'antd';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';
import AddRuleForm from '../components/AddRuleFrom';

const AdministrationPage: React.FC = () => {
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const navigate = useNavigate();

  const submitChat = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/admin_chat', {
        question: chatInput,
      });
      setChatResponse(res.data.answer);
    } catch (err) {
      message.error('Failed to contact backend');
    }
  };

  const controlMotor = async (state: 'on' | 'off') => {
    try {
      await axios.get(`http://localhost:5000/api/motor/${state}`);
      message.success(`Motor turned ${state}`);
    } catch {
      message.error('Failed to reach ESP32');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <Card title='LLM Command Input'>
        <Input.TextArea
          rows={3}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder='e.g., Turn motor on if temperature < 30'
        />
        <Button type='primary' onClick={submitChat} style={{ marginTop: 10 }}>
          Send
        </Button>
        <p style={{ marginTop: 20 }}>{chatResponse}</p>
      </Card>

      <Card title='Manual Motor Control' style={{ marginTop: 20 }}>
        <Button onClick={() => controlMotor('on')} type='primary'>
          Turn ON
        </Button>
        <Button onClick={() => controlMotor('off')} style={{ marginLeft: 10 }}>
          Turn OFF
        </Button>
      </Card>

      <Card title='Add Rule' style={{ marginTop: 20 }}>
        <Button onClick={() => navigate('/add-rule')} type='primary'>
          Add Rule
        </Button>
      </Card>
    </div>
  );
};

export default AdministrationPage;
