// MultiRobotPage.tsx - Full Implementation with Backend Integration
import { useState } from 'react';
import {
  Layout,
  Tabs,
  Button,
  Modal,
  Input,
  Select,
  Space,
  Badge,
  Card,
  Typography,
  List,
  Popconfirm,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  RobotOutlined,
  PlusOutlined,
  DeleteOutlined,
  ApiOutlined,
  DisconnectOutlined,
  VideoCameraOutlined,
  DashboardOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { useMultiRobot } from '../hooks/useMultiRobot';
import { RobotControl } from '../components/TurtlebotControl';
import { CameraFeed } from '../components/CameraROS';
import { RobotStatus } from '../components/RobotStatus';
import { NavigationControl } from '../components/NavigationControl';
import { VirtualJoystick } from '../components/VirtualJoystick';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const MultiRobotPage = () => {
  const {
    robots,
    loading,
    error,
    selectedRobot,
    selectRobot,
    registerRobot,
    connectRobot,
    disconnectRobot,
    refreshRobots,
  } = useMultiRobot();

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newRobotName, setNewRobotName] = useState('');
  const [newRobotId, setNewRobotId] = useState('');
  const [newRobotType, setNewRobotType] = useState('turtlebot2');
  const [newRobotIp, setNewRobotIp] = useState('');
  const [newRobotPort, setNewRobotPort] = useState('9090');

  const robotList = Object.entries(robots).map(([id, robot]) => ({
    id,
    ...robot,
  }));

  const activeRobotId = selectedRobot || robotList[0]?.id;
  const activeRobot = activeRobotId ? robots[activeRobotId] : null;

  const handleAddRobot = async () => {
    if (!newRobotName || !newRobotId || !newRobotIp) {
      alert('Please fill in all required fields');
      return;
    }

    const success = await registerRobot({
      robot_id: newRobotId,
      robot_type: newRobotType,
      ip_address: newRobotIp,
      rosbridge_port: parseInt(newRobotPort),
      capabilities: ['navigation', 'camera'],
    });

    if (success) {
      setIsAddModalVisible(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setNewRobotName('');
    setNewRobotId('');
    setNewRobotType('turtlebot2');
    setNewRobotIp('');
    setNewRobotPort('9090');
  };

  const handleConnect = async (robotId: string) => {
    await connectRobot(robotId);
  };

  const handleDisconnect = async (robotId: string) => {
    await disconnectRobot(robotId);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <RobotOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
          <Title level={3} style={{ margin: 0 }}>
            Multi-Robot Control Center
          </Title>
        </div>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          onClick={() => setIsAddModalVisible(true)}
          loading={loading}
        >
          Add Robot
        </Button>
      </Header>

      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        {error && (
          <Alert
            message='Error'
            description={error}
            type='error'
            showIcon
            closable
            style={{ marginBottom: '16px' }}
          />
        )}

        {/* Robot Selection Panel */}
        <Card style={{ marginBottom: '16px' }}>
          <div
            style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text strong>Select Robot:</Text>
            <Text type='secondary'>
              {robotList.length} Robot{robotList.length !== 1 ? 's' : ''} Registered
            </Text>
          </div>

          <Space wrap style={{ marginBottom: '16px' }}>
            {robotList.map((robot) => (
              <Button
                key={robot.id}
                type={activeRobotId === robot.id ? 'primary' : 'default'}
                onClick={() => selectRobot(robot.id)}
                icon={<RobotOutlined />}
              >
                {robot.id}
                <Badge
                  style={{ marginLeft: '8px' }}
                  status={robot.connected ? 'success' : 'default'}
                />
              </Button>
            ))}
          </Space>

          {activeRobot && (
            <>
              {/* Connection Panel */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: '#fafafa',
                  borderRadius: '8px',
                  border: '1px solid #d9d9d9',
                }}
              >
                <Row gutter={[16, 16]} align='middle'>
                  <Col>
                    <Text strong>Robot ID:</Text> <Text code>{activeRobotId}</Text>
                  </Col>
                  <Col>
                    <Text strong>Type:</Text> <Text>{activeRobot.type}</Text>
                  </Col>
                  <Col>
                    <Text strong>IP:</Text> <Text code>{activeRobot.ip}</Text>
                  </Col>
                  <Col>
                    <Text strong>Capabilities:</Text>{' '}
                    <Space size={4}>
                      {activeRobot.capabilities.map((cap) => (
                        <Badge key={cap} color='blue' text={cap} />
                      ))}
                    </Space>
                  </Col>
                  <Col flex='auto' style={{ textAlign: 'right' }}>
                    <Space>
                      {!activeRobot.connected ? (
                        <Button
                          type='primary'
                          icon={<ApiOutlined />}
                          onClick={() => handleConnect(activeRobotId)}
                          loading={loading}
                        >
                          Connect
                        </Button>
                      ) : (
                        <Button
                          danger
                          icon={<DisconnectOutlined />}
                          onClick={() => handleDisconnect(activeRobotId)}
                          loading={loading}
                        >
                          Disconnect
                        </Button>
                      )}
                    </Space>
                  </Col>
                </Row>
              </div>

              {/* Robot Control Tabs */}
              <div style={{ marginTop: '16px' }}>
                <Tabs defaultActiveKey='control' size='large'>
                  <Tabs.TabPane
                    key='control'
                    tab={
                      <span>
                        <RobotOutlined />
                        Control
                      </span>
                    }
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <RobotControl robotId={activeRobotId} />
                      <VirtualJoystick robotId={activeRobotId} />
                    </div>
                  </Tabs.TabPane>

                  <Tabs.TabPane
                    key='camera'
                    tab={
                      <span>
                        <VideoCameraOutlined />
                        Camera
                      </span>
                    }
                  >
                    <CameraFeed robotId={activeRobotId} robotIp={activeRobot.ip} />
                  </Tabs.TabPane>

                  <Tabs.TabPane
                    key='status'
                    tab={
                      <span>
                        <DashboardOutlined />
                        Status
                      </span>
                    }
                  >
                    <RobotStatus robotId={activeRobotId} />
                  </Tabs.TabPane>

                  <Tabs.TabPane
                    key='navigation'
                    tab={
                      <span>
                        <CompassOutlined />
                        Navigation
                      </span>
                    }
                  >
                    <NavigationControl robotId={activeRobotId} />
                  </Tabs.TabPane>
                </Tabs>
              </div>
            </>
          )}
        </Card>

        {/* Robot Overview Panel */}
        <Card title='All Robots Overview'>
          <List
            dataSource={robotList}
            locale={{ emptyText: 'No robots registered. Click "Add Robot" to get started.' }}
            renderItem={(robot) => (
              <List.Item
                actions={[
                  <Badge
                    key='status'
                    status={robot.connected ? 'success' : 'default'}
                    text={robot.connected ? 'Online' : 'Offline'}
                  />,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <RobotOutlined
                      style={{ fontSize: '24px', color: robot.connected ? '#52c41a' : '#d9d9d9' }}
                    />
                  }
                  title={robot.id}
                  description={
                    <Space direction='vertical' size={0}>
                      <Text type='secondary'>Type: {robot.type}</Text>
                      <Text type='secondary'>IP: {robot.ip}</Text>
                      <Space size={4}>
                        {robot.capabilities.map((cap) => (
                          <Badge key={cap} color='blue' text={cap} />
                        ))}
                      </Space>
                    </Space>
                  }
                />
                {robot.connected && robot.state && (
                  <div style={{ marginLeft: '60px' }}>
                    <Space direction='vertical' size={0}>
                      <Text type='secondary' style={{ fontSize: '12px' }}>
                        Battery: {robot.state.battery.percentage}%
                      </Text>
                      <Text type='secondary' style={{ fontSize: '12px' }}>
                        Mode: {robot.state.mode}
                      </Text>
                    </Space>
                  </div>
                )}
              </List.Item>
            )}
          />
        </Card>
      </Content>

      {/* Add Robot Modal */}
      <Modal
        title='Add New Robot'
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          resetForm();
        }}
        onOk={handleAddRobot}
        okText='Add Robot'
        confirmLoading={loading}
      >
        <Space direction='vertical' style={{ width: '100%' }} size='large'>
          <div>
            <Text strong>Robot Name (Display)</Text>
            <Input
              placeholder='e.g., TurtleBot2 Farm Security'
              value={newRobotName}
              onChange={(e) => setNewRobotName(e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>

          <div>
            <Text strong style={{ color: 'red' }}>
              * Robot ID (Unique)
            </Text>
            <Input
              placeholder='e.g., turtlebot2_farm_1'
              value={newRobotId}
              onChange={(e) => setNewRobotId(e.target.value.toLowerCase().replace(/\s/g, '_'))}
              style={{ marginTop: '8px' }}
            />
            <Text type='secondary' style={{ fontSize: '12px' }}>
              Must be unique. Use lowercase and underscores.
            </Text>
          </div>

          <div>
            <Text strong style={{ color: 'red' }}>
              * Robot Type
            </Text>
            <Select
              value={newRobotType}
              onChange={setNewRobotType}
              style={{ width: '100%', marginTop: '8px' }}
            >
              <Select.Option value='turtlebot2'>TurtleBot2</Select.Option>
              <Select.Option value='turtlebot3'>TurtleBot3</Select.Option>
              <Select.Option value='custom'>Custom Robot</Select.Option>
            </Select>
          </div>

          <div>
            <Text strong style={{ color: 'red' }}>
              * IP Address
            </Text>
            <Input
              placeholder='e.g., 192.168.1.100'
              value={newRobotIp}
              onChange={(e) => setNewRobotIp(e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>

          <div>
            <Text strong>ROSBridge Port</Text>
            <Input
              placeholder='9090'
              value={newRobotPort}
              onChange={(e) => setNewRobotPort(e.target.value)}
              style={{ marginTop: '8px' }}
            />
          </div>
        </Space>
      </Modal>
    </Layout>
  );
};

export default MultiRobotPage;
