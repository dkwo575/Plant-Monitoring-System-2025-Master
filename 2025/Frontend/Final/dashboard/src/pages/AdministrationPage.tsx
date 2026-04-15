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

// ------------------------- Version 2 - recent and will be used this------------------

// src/pages/AdministrationPage.tsx
import React, { useState, useEffect } from 'react';
import { Input, Button, Card, message, Row, Col, Spin, Select, DatePicker } from 'antd';
import { CalendarOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { Navigate, useNavigate } from 'react-router-dom';
import AddRuleForm from '../components/AddRuleFrom';
import RuleTable from '../components/RuleTable';
import dayjs, { Dayjs } from 'dayjs';
import { endsWith } from 'lodash-es';

const { Option } = Select;

const AdministrationPage: React.FC = () => {
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const navigate = useNavigate();

  const [reportPeriod, setReportPeriod] = useState('weekly');
  const [reportFormat, setReportFormat] = useState('pdf');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(7, 'day'));
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [reportStatus, setReportStatus] = useState<string[]>([]);

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

  const controlLight = async (state: 'on' | 'off') => {
    try {
      await axios.get(`http://localhost:5000/api/led/${state}`);
      message.success(`Light turned ${state}`);
      // Assuming you want to navigate to a light control page after successful action
    } catch {
      message.error('Failed to reach light control');
    }
  };

  const calculateDateRange = () => {
    if (useCustomDate && startDate) {
      const start = startDate;
      let end: Dayjs;

      if (reportPeriod === 'weekly') {
        end = start.add(7, 'day');
      } else if (reportPeriod === 'monthly') {
        end = start.add(30, 'day');
      } else {
        end = start;
      }

      return { start, end };
    } else {
      // Default behavior - calculate from current date
      const end = dayjs();
      let start: Dayjs;

      if (reportPeriod === 'weekly') {
        start = end.subtract(7, 'day');
      } else if (reportPeriod === 'monthly') {
        start = end.subtract(30, 'day');
      } else {
        start = end;
      }

      return { start, end };
    }
  };

  // 2. Generate report with date range

  const generateReport = async () => {
    if (useCustomDate && !startDate) {
      message.error('Please select a start date');
      return;
    }

    const { start, end } = calculateDateRange();

    if (!start || !end) {
      message.error('Invalid date range');
      return;
    }

    // Check if end date is in the future
    if (end.isAfter(dayjs())) {
      message.warning('End date is in the future. Report will include data up to today.');
    }

    setIsGeneratingReport(true);
    setReportStatus([]); // Clear previous status messages

    const eventSource = new EventSource('http://localhost:5000/api/report_status');

    eventSource.onmessage = (event) => {
      setReportStatus((prevStatus) => [...prevStatus, event.data]);
    };

    eventSource.onerror = () => {
      message.error('Failed to connect to the report generation service.');
      setIsGeneratingReport(false);
      eventSource.close();
    };

    try {
      // Prepare API parameters
      const apiParams = {
        period: reportPeriod,
        format: reportFormat,
        // eslint-disable-next-line camelcase
        use_custom_date: useCustomDate.toString(),
      };

      // Add custom dates if using custom date mode
      if (useCustomDate && start && end) {
        apiParams.start_date = start.format('YYYY-MM-DD');
        apiParams.end_date = end.format('YYYY-MM-DD');
      }

      console.log('Generating report with params:', apiParams);

      // Make the API call
      const response = await axios.get('http://localhost:5000/api/report_bydate', {
        params: apiParams,
        responseType: 'blob', // Important for file downloads
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Get filename from response headers or create a default one
      const contentDisposition = response.headers['content-disposition'];
      let filename = `farm_report_${reportPeriod}.pdf`; // `farm_report_${start}_to_${end}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      if (useCustomDate) {
        message.success(
          `Custom date report requested for ${start.format('MMM DD, YYYY')} to ${end.format(
            'MMM DD, YYYY',
          )}. Note: Current backend generates reports from today backwards.`,
        );
      } else {
        message.success('Report generated and downloaded successfully!');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      if (error.response?.status === 404) {
        message.error('No data available for the specified period');
      } else if (error.response?.status === 400) {
        message.error('Invalid parameters specified');
      } else {
        message.error('Failed to generate report');
      }
    } finally {
      setIsGeneratingReport(false);
      eventSource.close();
    }
  };

  const { start: calculatedStart, end: calculatedEnd } = calculateDateRange();

  // 1. Generate report function without date range
  // const generateReport = async () => {
  //   setIsGeneratingReport(true);
  //   try {
  //     const response = await axios.get('http://localhost:5000/api/report', {
  //       params: {
  //         period: reportPeriod,
  //         format: reportFormat,
  //       },
  //       responseType: 'blob', // Important for file downloads
  //     });

  //     // Create blob link to download
  //     const url = window.URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement('a');
  //     link.href = url;

  //     // Get filename from response headers or create a default one
  //     const contentDisposition =
  //       response.headers['Content-Disposition'] || response.headers['content-disposition'];
  //     let filename = `farm_report_${reportPeriod}.pdf`;

  //     if (contentDisposition) {
  //       const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  //       if (filenameMatch?.[1]) {
  //         filename = filenameMatch[1].replace(/['"]/g, ''); // Remove quotes if present
  //       }
  //     }

  //     console.log('Content-Disposition:', contentDisposition);

  //     link.setAttribute('download', filename);
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();
  //     window.URL.revokeObjectURL(url);

  //     message.success('Report generated and downloaded successfully!');
  //   } catch (error) {
  //     console.error('Error generating report:', error);
  //     if (
  //       typeof error === 'object' &&
  //       error !== null &&
  //       'response' in error &&
  //       typeof (error as any).response === 'object'
  //     ) {
  //       const response = (error as any).response;
  //       if (response.status === 404) {
  //         message.error('No data available for the specified period');
  //       } else if (response.status === 400) {
  //         message.error('Invalid parameters specified');
  //       } else {
  //         message.error('Failed to generate report');
  //       }
  //     } else {
  //       message.error('Failed to generate report');
  //     }
  //   } finally {
  //     setIsGeneratingReport(false);
  //   }
  // };

  return (
    <div style={{ padding: 20, overflow: 'scroll', width: '100%', height: '100vh' }}>
      <Card title='LLM Command Input'>
        <Input.TextArea
          rows={3}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder='Examples:
          • Turn on motor if temperature > 30
          • Turn off LED if humidity < 40  
          • Turn on light when soil humidity < 50
          • Turn off motor if water level > 80'
        />
        <Button type='primary' onClick={submitChat} style={{ marginTop: 15 }}>
          Send
        </Button>
        <p style={{ marginTop: 20 }}>{chatResponse}</p>
      </Card>

      <Card title='Manual Sensor Control' style={{ marginTop: 20 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Card title='Motor Control'>
              <Button onClick={() => controlMotor('on')} type='primary'>
                Turn ON
              </Button>
              <Button onClick={() => controlMotor('off')} style={{ marginLeft: 15 }}>
                Turn OFF
              </Button>
            </Card>
          </Col>
          <Col span={12}>
            <Card title='Light Control'>
              <Button onClick={() => controlLight('on')} type='primary'>
                Turn ON
              </Button>
              <Button onClick={() => controlLight('off')} style={{ marginLeft: 10 }}>
                Turn OFF
              </Button>
            </Card>
          </Col>
        </Row>
      </Card>
      {/* This is code for generating environmental report without date range */}
      {/* <Card title='Generate Environmental Report' style={{ marginTop: 20 }}>
        <Row gutter={16} align='middle'>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>Report Period:</strong>
            </div>
            <Select value={reportPeriod} onChange={setReportPeriod} style={{ width: '100%' }}>
              <Option value='weekly'>Weekly</Option>
              <Option value='monthly'>Monthly</Option>
            </Select>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>Report Format:</strong>
            </div>
            <Select value={reportFormat} onChange={setReportFormat} style={{ width: '100%' }}>
              <Option value='pdf'>PDF</Option>
            </Select>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8 }}>
              <strong>Action:</strong>
            </div>
            <Button
              type='primary'
              onClick={generateReport}
              disabled={isGeneratingReport}
              icon={<DownloadOutlined />}
              style={{ width: '100%' }}
            >
              {isGeneratingReport ? <Spin size='small' /> : 'Generate & Download Report'}
            </Button>
          </Col>
        </Row>
        <div style={{ marginTop: 16, color: '#666', fontSize: '14px' }}>
          <p>
            <strong>Report includes:</strong>
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>
              Environmental data analysis (temperature, humidity, light, soil humidity, water level,
              steam)
            </li>
            <li>Statistical summaries and trends</li>
            <li>Graphical visualizations</li>
            <li>AI-generated insights and recommendations</li>
          </ul>
        </div>
      </Card> */}

      {/* This is code for generating environmental report with date range */}
      <Card title='Generate Environmental Report' style={{ marginTop: 20 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={24}>
            <div style={{ marginBottom: 16 }}>
              <Button
                type={!useCustomDate ? 'primary' : 'default'}
                onClick={() => setUseCustomDate(false)}
                style={{ marginRight: 8 }}
              >
                Default Report (from today backwards)
              </Button>
              <Button
                type={useCustomDate ? 'primary' : 'default'}
                onClick={() => setUseCustomDate(true)}
              >
                Custom Start Date Report
              </Button>
            </div>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          {useCustomDate && (
            <Col span={8}>
              <div style={{ marginBottom: 8 }}>
                <strong>Start Date:</strong>
              </div>
              <DatePicker
                value={startDate}
                onChange={setStartDate}
                style={{ width: '100%' }}
                placeholder='Select start date'
                suffixIcon={<CalendarOutlined />}
                disabledDate={(current) => current && current > dayjs().endOf('day')}
              />
            </Col>
          )}
          <Col span={useCustomDate ? 8 : 12}>
            <div style={{ marginBottom: 8 }}>
              <strong>Report Period:</strong>
            </div>
            <Select value={reportPeriod} onChange={setReportPeriod} style={{ width: '100%' }}>
              <Option value='weekly'>Weekly (7 days)</Option>
              <Option value='monthly'>Monthly (30 days)</Option>
            </Select>
          </Col>
          <Col span={useCustomDate ? 8 : 12}>
            <div style={{ marginBottom: 8 }}>
              <strong>Report Format:</strong>
            </div>
            <Select value={reportFormat} onChange={setReportFormat} style={{ width: '100%' }}>
              <Option value='pdf'>PDF</Option>
            </Select>
          </Col>
        </Row>

        {calculatedStart && calculatedEnd && (
          <Card
            size='small'
            style={{
              backgroundColor: useCustomDate ? '#fff7e6' : '#f6f8fa',
              border: useCustomDate ? '1px solid #ffd591' : '1px solid #e1e4e8',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: '14px', color: '#666' }}>
              <strong>
                Date Range {useCustomDate ? '(Preview - Custom)' : '(Current Backend Logic)'}:
              </strong>{' '}
              {calculatedStart?.format('MMM DD, YYYY')} to {calculatedEnd?.format('MMM DD, YYYY')}
              <br />
              <strong>Duration:</strong> {reportPeriod === 'weekly' ? '7 days' : '30 days'}
              {useCustomDate && (
                <div style={{ color: '#d46b08', marginTop: 4 }}>
                  <strong>Note:</strong> Custom dates require backend modification. Currently
                  generates from today backwards.
                </div>
              )}
            </div>
          </Card>
        )}

        <Row gutter={16}>
          <Col span={24}>
            <Button
              type='primary'
              onClick={generateReport}
              disabled={isGeneratingReport || (useCustomDate && !startDate)}
              icon={<DownloadOutlined />}
              size='large'
              style={{ width: '100%' }}
            >
              {isGeneratingReport ? <Spin size='small' /> : 'Generate & Download Report'}
            </Button>
          </Col>
        </Row>

        {isGeneratingReport && (
          <div style={{ marginTop: 16, padding: 12, border: '1px solid #d9d9d9', borderRadius: 4 }}>
            <p>
              <strong>Report Generation Status:</strong>
            </p>
            {reportStatus.map((status, index) => (
              <p key={index}>{status}</p>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16, color: '#666', fontSize: '14px' }}>
          <p>
            <strong>Report includes:</strong>
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>
              Environmental data analysis (temperature, humidity, light, soil humidity, water level,
              steam)
            </li>
            <li>Statistical summaries and trends over the selected period</li>
            <li>Graphical visualizations for each sensor metric</li>
            <li>AI-generated insights and recommendations</li>
          </ul>

          {useCustomDate && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                backgroundColor: '#fff7e6',
                borderRadius: 4,
                border: '1px solid #ffd591',
              }}
            >
              <p style={{ margin: 0, color: '#d46b08' }}>
                <strong>Custom Date Feature:</strong> To fully implement custom start dates, your
                backend needs modification. The current version will generate reports based on the
                current date going backwards, regardless of the custom start date selected.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card title='Add rules' style={{ marginTop: 20 }}>
        <AddRuleForm />
      </Card>

      <Card title='Rule Tables' style={{ marginTop: 20 }}>
        <RuleTable />
      </Card>
    </div>
  );
};

export default AdministrationPage;

// ------------------------------ version 4 ------------- latest version

// import React, { useState } from 'react';
// import { Input, Button, Card, message } from 'antd';
// import axios from 'axios';

// const AdministrationPage: React.FC = () => {
//   const [chatInput, setChatInput] = useState('');
//   const [chatResponse, setChatResponse] = useState('');

//   const submitChat = async () => {
//     try {
//       const res = await axios.post('http://localhost:5000/api/admin_chat_V2', {
//         question: chatInput,
//       });
//       setChatResponse(res.data.answer);
//     } catch (err) {
//       message.error('Failed to contact backend');
//     }
//   };

//   const controlMotor = async (state: 'on' | 'off') => {
//     try {
//       await axios.get(`http://localhost:5000/api/motor/${state}`);
//       message.success(`Motor turned ${state}`);
//     } catch {
//       message.error('Failed to reach ESP32');
//     }
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <Card title='LLM Command Input'>
//         <Input.TextArea
//           rows={3}
//           value={chatInput}
//           onChange={(e) => setChatInput(e.target.value)}
//           placeholder='e.g., Turn motor on if temperature < 30'
//         />
//         <Button type='primary' onClick={submitChat} style={{ marginTop: 10 }}>
//           Send
//         </Button>
//         <p style={{ marginTop: 20 }}>{chatResponse}</p>
//       </Card>

//       <Card title='Manual Motor Control' style={{ marginTop: 20 }}>
//         <Button onClick={() => controlMotor('on')} type='primary'>
//           Turn ON
//         </Button>
//         <Button onClick={() => controlMotor('off')} style={{ marginLeft: 10 }}>
//           Turn OFF
//         </Button>
//       </Card>
//     </div>
//   );
// };

// export default AdministrationPage;

// ------------------------- Version 3------------------

// src/pages/AdministrationPage.tsx

// import React, { useState } from 'react';
// import { Button, Input, Card, Typography, message } from 'antd';
// import axios from 'axios';

// const { Title } = Typography;

// const AdministrationPage: React.FC = () => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [id, setId] = useState('');
//   const [password, setPassword] = useState('');
//   const [command, setCommand] = useState('');

//   const handleLogin = () => {
//     if (id === 'admin' && password === '1234') {
//       setIsAuthenticated(true);
//     } else {
//       message.error('Invalid credentials');
//     }
//   };

//   const sendCommand = async () => {
//     const res = await axios.post('http://YOUR_FLASK_SERVER_IP:5000/api/admin_chat', {
//       question: command,
//     });
//     message.success(res.data.answer);
//   };

//   const manualControl = async (action: 'on' | 'off') => {
//     await axios.post(`http://YOUR_FLASK_SERVER_IP:5000/api/motor/${action}`);
//     message.success(`Motor turned ${action}`);
//   };

//   if (!isAuthenticated) {
//     return (
//       <Card style={{ maxWidth: 400, margin: '50px auto' }}>
//         <Title level={4}>Admin Login</Title>
//         <Input
//           placeholder='ID'
//           value={id}
//           onChange={(e) => setId(e.target.value)}
//           style={{ marginBottom: 10 }}
//         />
//         <Input.Password
//           placeholder='Password'
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           style={{ marginBottom: 10 }}
//         />
//         <Button type='primary' onClick={handleLogin}>
//           Login
//         </Button>
//       </Card>
//     );
//   }

//   return (
//     <Card style={{ maxWidth: 600, margin: '50px auto' }}>
//       <Title level={4}>Administration Panel</Title>

//       <div style={{ marginBottom: 20 }}>
//         <Input.TextArea
//           rows={3}
//           placeholder='Give natural language command'
//           value={command}
//           onChange={(e) => setCommand(e.target.value)}
//         />
//         <Button type='primary' onClick={sendCommand} style={{ marginTop: 10 }}>
//           Submit Command
//         </Button>
//       </div>

//       <div>
//         <Button onClick={() => manualControl('on')} style={{ marginRight: 10 }}>
//           Turn Motor On
//         </Button>
//         <Button onClick={() => manualControl('off')}>Turn Motor Off</Button>
//       </div>
//     </Card>
//   );
// };

// export default AdministrationPage;
