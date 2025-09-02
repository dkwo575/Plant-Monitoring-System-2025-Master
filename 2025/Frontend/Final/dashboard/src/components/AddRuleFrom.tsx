import { Form, Input, Button, Select, message as antdMessage } from 'antd';
import axios from 'axios';

const AddRuleForm: React.FC = () => {
  const onFinish = async (values: any) => {
    try {
      await axios.post('http://localhost:5000/add_condition', values);
      antdMessage.success('Rule added successfully!');
    } catch {
      antdMessage.error('Failed to add rule.');
    }
  };

  return (
    <Form onFinish={onFinish} layout='inline'>
      <Form.Item name='sensor' rules={[{ required: true }]}>
        <Input placeholder='Sensor (temperature)' />
      </Form.Item>
      <Form.Item name='operator' rules={[{ required: true }]}>
        <Select style={{ width: 80 }}>
          <Select.Option value='<'>{'<'}</Select.Option>
          <Select.Option value='>'>{'>'}</Select.Option>
          <Select.Option value='=='>{'=='}</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name='value' rules={[{ required: true }]}>
        <Input placeholder='Value' />
      </Form.Item>
      <Form.Item name='action' rules={[{ required: true }]}>
        <Select style={{ width: 120 }}>
          <Select.Option value='motor_on'>Motor On</Select.Option>
          <Select.Option value='motor_off'>Motor Off</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type='primary' htmlType='submit'>
          Add Rule
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AddRuleForm;
