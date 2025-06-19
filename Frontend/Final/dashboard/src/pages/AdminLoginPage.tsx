import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage = () => {
  const navigate = useNavigate();

  const onFinish = (values: any) => {
    const { username, password } = values;
    if (username === 'admin' && password === '1234') {
      message.success('Login successful');
      navigate('/Admin');
    } else {
      message.error('Invalid credentials');
    }
  };

  return (
    <Form onFinish={onFinish} style={{ maxWidth: 400, margin: '5rem auto' }}>
      <h2>Admin Login</h2>
      <Form.Item name='username' rules={[{ required: true }]}>
        <Input placeholder='Username' />
      </Form.Item>
      <Form.Item name='password' rules={[{ required: true }]}>
        <Input.Password placeholder='Password' />
      </Form.Item>
      <Form.Item>
        <Button htmlType='submit' type='primary' block>
          Login
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AdminLoginPage;
