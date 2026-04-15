// import { useState, useEffect, useCallback } from 'react';
// import type { RosInstance, TopicInstance, ServiceInstance } from '../types/roslib';
// import type { Waypoint, NavigationStatus, NavigationState } from '../types/navigation';
// import { Content } from 'antd/es/layout/layout';

// interface NavigationControlProps {
//   ros: RosInstance | null;
//   connected: boolean;
// }

// export const NavigationControl: React.FC<NavigationControlProps> = ({ ros, connected }) => {
//   const [waypoints, setWaypoints] = useState<Waypoint[]>([
//     {
//       name: 'Zone A - Entrance',
//       position: { x: 2.0, y: 1.0, z: 0.0 },
//       orientation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 },
//     },
//     {
//       name: 'Zone B - Main Area',
//       position: { x: 5.0, y: 3.0, z: 0.0 },
//       orientation: { x: 0.0, y: 0.0, z: 0.707, w: 0.707 },
//     },
//     {
//       name: 'Zone C - Back Section',
//       position: { x: 3.0, y: 5.0, z: 0.0 },
//       orientation: { x: 0.0, y: 0.0, z: 1.0, w: 0.0 },
//     },
//   ]);

//   const [navState, setNavState] = useState<NavigationState>({
//     status: 'IDLE' as NavigationStatus,
//     currentWaypoint: null,
//     progress: 0,
//   });

//   const [isPatrolling, setIsPatrolling] = useState(false);
//   const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
//   const [goalTopic, setGoalTopic] = useState<TopicInstance | null>(null);
//   const [resultTopic, setResultTopic] = useState<TopicInstance | null>(null);

//   useEffect(() => {
//     if (!ros || !connected || !window.ROSLIB) return;

//     // Setup goal publisher for move_base
//     const goalPublisher = new window.ROSLIB.Topic({
//       ros: ros,
//       name: '/move_base_simple/goal',
//       messageType: 'geometry_msgs/PoseStamped',
//     });
//     setGoalTopic(goalPublisher);

//     // Subscribe to move_base result
//     const resultSubscriber = new window.ROSLIB.Topic({
//       ros: ros,
//       name: '/move_base/result',
//       messageType: 'move_base_msgs/MoveBaseActionResult',
//     });

//     resultSubscriber.subscribe((message: any) => {
//       const status = message.status.status;
//       if (status === 3) {
//         // SUCCEEDED
//         setNavState((prev) => ({
//           ...prev,
//           status: 'REACHED' as NavigationStatus,
//           progress: 100,
//         }));
//       } else if (status === 4) {
//         // ABORTED
//         setNavState((prev) => ({
//           ...prev,
//           status: 'FAILED' as NavigationStatus,
//           error: 'Navigation failed',
//         }));
//       }
//     });

//     setResultTopic(resultSubscriber);

//     return () => {
//       goalPublisher.unadvertise();
//       resultSubscriber.unsubscribe();
//     };
//   }, [ros, connected]);

//   const sendGoal = useCallback(
//     (waypoint: Waypoint) => {
//       if (!goalTopic || !window.ROSLIB) return;

//       const goal = new window.ROSLIB.Message({
//         header: {
//           frame_id: 'map',
//           stamp: {
//             secs: Math.floor(Date.now() / 1000),
//             nsecs: (Date.now() % 1000) * 1000000,
//           },
//         },
//         pose: {
//           position: waypoint.position,
//           orientation: waypoint.orientation,
//         },
//       });

//       goalTopic.publish(goal);
//       setNavState({
//         status: 'NAVIGATING' as NavigationStatus,
//         currentWaypoint: waypoint.name,
//         progress: 0,
//       });
//     },
//     [goalTopic],
//   );

//   const startPatrol = () => {
//     if (waypoints.length === 0) return;
//     setIsPatrolling(true);
//     setCurrentWaypointIndex(0);
//     sendGoal(waypoints[0]);
//   };

//   const stopPatrol = () => {
//     setIsPatrolling(false);
//     cancelNavigation();
//   };

//   const cancelNavigation = () => {
//     if (!ros || !window.ROSLIB) return;

//     // Send cancel goal to move_base
//     const cancelTopic = new window.ROSLIB.Topic({
//       ros: ros,
//       name: '/move_base/cancel',
//       messageType: 'actionlib_msgs/GoalID',
//     });

//     const cancelMsg = new window.ROSLIB.Message({});
//     cancelTopic.publish(cancelMsg);

//     setNavState({
//       status: 'IDLE' as NavigationStatus,
//       currentWaypoint: null,
//       progress: 0,
//     });
//   };

//   const goToWaypoint = (index: number) => {
//     if (index >= 0 && index < waypoints.length) {
//       setCurrentWaypointIndex(index);
//       sendGoal(waypoints[index]);
//     }
//   };

//   // Auto-advance to next waypoint when current is reached
//   useEffect(() => {
//     if (isPatrolling && navState.status === 'REACHED') {
//       setTimeout(() => {
//         const nextIndex = (currentWaypointIndex + 1) % waypoints.length;
//         setCurrentWaypointIndex(nextIndex);
//         sendGoal(waypoints[nextIndex]);
//       }, 2000); // Wait 2 seconds before moving to next waypoint
//     }
//   }, [isPatrolling, navState.status, currentWaypointIndex, waypoints, sendGoal]);

//   const getStatusColor = (status: NavigationStatus): string => {
//     switch (status) {
//       case 'NAVIGATING':
//         return '#2196F3';
//       case 'REACHED':
//         return '#4CAF50';
//       case 'FAILED':
//         return '#f44336';
//       case 'PAUSED':
//         return '#FF9800';
//       default:
//         return '#9E9E9E';
//     }
//   };

//   const addWaypoint = () => {
//     const newWaypoint: Waypoint = {
//       name: `Zone ${String.fromCharCode(65 + waypoints.length)}`,
//       position: { x: 0, y: 0, z: 0 },
//       orientation: { x: 0, y: 0, z: 0, w: 1 },
//     };
//     setWaypoints([...waypoints, newWaypoint]);
//   };

//   const updateWaypoint = (index: number, field: string, value: any) => {
//     const updated = [...waypoints];
//     if (field === 'name') {
//       updated[index].name = value;
//     } else if (field.startsWith('position.')) {
//       const key = field.split('.')[1] as 'x' | 'y' | 'z';
//       updated[index].position[key] = parseFloat(value) || 0;
//     }
//     setWaypoints(updated);
//   };

//   const removeWaypoint = (index: number) => {
//     setWaypoints(waypoints.filter((_, i) => i !== index));
//   };

//   return (
//     <div className='navigation-control'>
//       <h2>Autonomous Navigation</h2>

//       <div className='nav-status'>
//         <div className='status-badge' style={{ backgroundColor: getStatusColor(navState.status) }}>
//           {navState.status}
//         </div>
//         {navState.currentWaypoint && (
//           <div className='current-waypoint'>
//             Current: <strong>{navState.currentWaypoint}</strong>
//           </div>
//         )}
//         {navState.error && <div className='nav-error'>⚠️ {navState.error}</div>}
//       </div>

//       <div className='patrol-controls'>
//         <button
//           onClick={startPatrol}
//           disabled={!connected || isPatrolling || waypoints.length === 0}
//           className='btn-primary'
//         >
//           🚀 Start Patrol
//         </button>
//         <button onClick={stopPatrol} disabled={!connected || !isPatrolling} className='btn-danger'>
//           ⏹️ Stop Patrol
//         </button>
//         <button
//           onClick={cancelNavigation}
//           disabled={!connected || navState.status === 'IDLE'}
//           className='btn-warning'
//         >
//           ❌ Cancel Navigation
//         </button>
//       </div>

//       <Content style={{ padding: '24px', background: '#f0f2f5', overflow: 'auto' }}>
//         <div className='waypoints-section'>
//           <div className='section-header'>
//             <h3>Waypoints</h3>
//             <button onClick={addWaypoint} className='btn-add'>
//               ➕ Add Waypoint
//             </button>
//           </div>

//           <div className='waypoints-list'>
//             {waypoints.map((waypoint, index) => (
//               <div
//                 key={index}
//                 className={`waypoint-card ${currentWaypointIndex === index ? 'active' : ''}`}
//               >
//                 <div className='waypoint-header'>
//                   <input
//                     type='text'
//                     value={waypoint.name}
//                     onChange={(e) => updateWaypoint(index, 'name', e.target.value)}
//                     className='waypoint-name-input'
//                   />
//                   <div className='waypoint-actions'>
//                     <button
//                       onClick={() => goToWaypoint(index)}
//                       disabled={!connected}
//                       className='btn-sm'
//                     >
//                       Go
//                     </button>
//                     <button onClick={() => removeWaypoint(index)} className='btn-sm btn-danger'>
//                       🗑️
//                     </button>
//                   </div>
//                 </div>

//                 <div className='waypoint-coords'>
//                   <div className='coord-group'>
//                     <label>X:</label>
//                     <input
//                       type='number'
//                       step='0.1'
//                       value={waypoint.position.x}
//                       onChange={(e) => updateWaypoint(index, 'position.x', e.target.value)}
//                     />
//                   </div>
//                   <div className='coord-group'>
//                     <label>Y:</label>
//                     <input
//                       type='number'
//                       step='0.1'
//                       value={waypoint.position.y}
//                       onChange={(e) => updateWaypoint(index, 'position.y', e.target.value)}
//                     />
//                   </div>
//                   <div className='coord-group'>
//                     <label>Z:</label>
//                     <input
//                       type='number'
//                       step='0.1'
//                       value={waypoint.position.z}
//                       onChange={(e) => updateWaypoint(index, 'position.z', e.target.value)}
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {isPatrolling && (
//           <div className='patrol-info'>
//             <p>
//               🔄 Patrolling: Waypoint {currentWaypointIndex + 1} of {waypoints.length}
//             </p>
//             <div className='progress-bar'>
//               <div className='progress-fill' style={{ width: `${navState.progress}%` }} />
//             </div>
//           </div>
//         )}
//       </Content>
//     </div>
//   );
// };

// =========== version 2 ==============

import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  List,
  Input,
  InputNumber,
  Typography,
  Tag,
  Progress,
  Popconfirm,
  Row,
  Col,
  message,
  Alert,
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useBackendAPI } from '../hooks/useBackendAPI';
import type { Waypoint } from '../types/navigation';

const { Title, Text } = Typography;

export const NavigationControl: React.FC = () => {
  const { connected, sendGoal, cancelNavigation, startPatrol, stopPatrol, robotStatus } =
    useBackendAPI();

  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    {
      name: 'Zone A - Entrance',
      position: { x: 2.0, y: 1.0, z: 0.0 },
      orientation: { x: 0.0, y: 0.0, z: 0.0, w: 1.0 },
    },
    {
      name: 'Zone B - Main Area',
      position: { x: 5.0, y: 3.0, z: 0.0 },
      orientation: { x: 0.0, y: 0.0, z: 0.707, w: 0.707 },
    },
    {
      name: 'Zone C - Back Section',
      position: { x: 3.0, y: 5.0, z: 0.0 },
      orientation: { x: 0.0, y: 0.0, z: 1.0, w: 0.0 },
    },
  ]);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const isPatrolling = robotStatus?.patrol_active || false;
  const currentMode = robotStatus?.mode || 'idle';

  const handleStartPatrol = async () => {
    if (waypoints.length === 0) {
      message.error('Please add at least one waypoint');
      return;
    }
    const success = await startPatrol(waypoints);
    if (success) {
      message.success('Patrol started successfully');
    }
  };

  const handleStopPatrol = async () => {
    const success = await stopPatrol();
    if (success) {
      message.success('Patrol stopped');
    }
  };

  const handleGoToWaypoint = async (index: number) => {
    const waypoint = waypoints[index];
    const success = await sendGoal(waypoint.position, waypoint.orientation);
    if (success) {
      message.success(`Navigating to ${waypoint.name}`);
    }
  };

  const addWaypoint = () => {
    const newWaypoint: Waypoint = {
      name: `Zone ${String.fromCharCode(65 + waypoints.length)}`,
      position: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 },
    };
    setWaypoints([...waypoints, newWaypoint]);
    setEditingIndex(waypoints.length);
  };

  const updateWaypoint = (index: number, field: string, value: any) => {
    const updated = [...waypoints];
    if (field === 'name') {
      updated[index].name = value;
    } else if (field.startsWith('position.')) {
      const axis = field.split('.')[1] as 'x' | 'y' | 'z';
      updated[index].position[axis] = value || 0;
    } else if (field.startsWith('orientation.')) {
      const axis = field.split('.')[1] as 'x' | 'y' | 'z' | 'w';
      updated[index].orientation[axis] = value || 0;
    }
    setWaypoints(updated);
  };

  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const getStatusColor = (mode: string) => {
    switch (mode) {
      case 'navigating':
        return 'processing';
      case 'patrol':
        return 'success';
      case 'idle':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Space direction='vertical' size='large' style={{ width: '100%', overflow: 'auto' }}>
      {/* Status Card */}
      <Card>
        <Space direction='vertical' size='middle' style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              Navigation Control
            </Title>
            <Tag color={getStatusColor(currentMode)} icon={<EnvironmentOutlined />}>
              {currentMode.toUpperCase()}
            </Tag>
          </div>

          {isPatrolling && (
            <Alert
              message='Patrol Active'
              description='Robot is currently patrolling through waypoints'
              type='info'
              showIcon
              icon={<CheckCircleOutlined />}
            />
          )}

          <Space wrap>
            <Button
              type='primary'
              icon={<PlayCircleOutlined />}
              onClick={handleStartPatrol}
              disabled={!connected || isPatrolling || waypoints.length === 0}
              size='large'
            >
              Start Patrol
            </Button>
            <Button
              danger
              icon={<PauseCircleOutlined />}
              onClick={handleStopPatrol}
              disabled={!connected || !isPatrolling}
              size='large'
            >
              Stop Patrol
            </Button>
            <Button
              icon={<CloseCircleOutlined />}
              onClick={cancelNavigation}
              disabled={!connected || currentMode === 'idle'}
              size='large'
            >
              Cancel Navigation
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Waypoints Card */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>Waypoints ({waypoints.length})</Text>
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={addWaypoint}
              disabled={isPatrolling}
            >
              Add Waypoint
            </Button>
          </div>
        }
      >
        <List
          dataSource={waypoints}
          locale={{ emptyText: 'No waypoints. Click "Add Waypoint" to create one.' }}
          renderItem={(wp, idx) => (
            <List.Item
              style={{
                border: editingIndex === idx ? '2px solid #1890ff' : '1px solid #f0f0f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                backgroundColor: editingIndex === idx ? '#f0f8ff' : '#fff',
              }}
            >
              <Space direction='vertical' style={{ width: '100%' }} size='middle'>
                {/* Waypoint Name */}
                <div>
                  <Text strong>Name:</Text>
                  <Input
                    value={wp.name}
                    onChange={(e) => updateWaypoint(idx, 'name', e.target.value)}
                    onFocus={() => setEditingIndex(idx)}
                    placeholder='Waypoint name'
                    disabled={isPatrolling}
                  />
                </div>

                {/* Position Inputs */}
                <div>
                  <Text strong>Position (meters):</Text>
                  <Row gutter={8}>
                    <Col span={8}>
                      <Space direction='vertical' size={4} style={{ width: '100%' }}>
                        <Text type='secondary' style={{ fontSize: '12px' }}>
                          X:
                        </Text>
                        <InputNumber
                          value={wp.position.x}
                          onChange={(v) => updateWaypoint(idx, 'position.x', v)}
                          style={{ width: '100%' }}
                          step={0.1}
                          disabled={isPatrolling}
                          placeholder='0.0'
                        />
                      </Space>
                    </Col>
                    <Col span={8}>
                      <Space direction='vertical' size={4} style={{ width: '100%' }}>
                        <Text type='secondary' style={{ fontSize: '12px' }}>
                          Y:
                        </Text>
                        <InputNumber
                          value={wp.position.y}
                          onChange={(v) => updateWaypoint(idx, 'position.y', v)}
                          style={{ width: '100%' }}
                          step={0.1}
                          disabled={isPatrolling}
                          placeholder='0.0'
                        />
                      </Space>
                    </Col>
                    <Col span={8}>
                      <Space direction='vertical' size={4} style={{ width: '100%' }}>
                        <Text type='secondary' style={{ fontSize: '12px' }}>
                          Z:
                        </Text>
                        <InputNumber
                          value={wp.position.z}
                          onChange={(v) => updateWaypoint(idx, 'position.z', v)}
                          style={{ width: '100%' }}
                          step={0.1}
                          disabled={isPatrolling}
                          placeholder='0.0'
                        />
                      </Space>
                    </Col>
                  </Row>
                </div>

                {/* Orientation Inputs */}
                <div>
                  <Text strong>Orientation (quaternion):</Text>
                  <Row gutter={8}>
                    <Col span={6}>
                      <Space direction='vertical' size={4} style={{ width: '100%' }}>
                        <Text type='secondary' style={{ fontSize: '12px' }}>
                          X:
                        </Text>
                        <InputNumber
                          value={wp.orientation.x}
                          onChange={(v) => updateWaypoint(idx, 'orientation.x', v)}
                          style={{ width: '100%' }}
                          step={0.1}
                          disabled={isPatrolling}
                          placeholder='0.0'
                        />
                      </Space>
                    </Col>
                    <Col span={6}>
                      <Space direction='vertical' size={4} style={{ width: '100%' }}>
                        <Text type='secondary' style={{ fontSize: '12px' }}>
                          Y:
                        </Text>
                        <InputNumber
                          value={wp.orientation.y}
                          onChange={(v) => updateWaypoint(idx, 'orientation.y', v)}
                          style={{ width: '100%' }}
                          step={0.1}
                          disabled={isPatrolling}
                          placeholder='0.0'
                        />
                      </Space>
                    </Col>
                    <Col span={6}>
                      <Space direction='vertical' size={4} style={{ width: '100%' }}>
                        <Text type='secondary' style={{ fontSize: '12px' }}>
                          Z:
                        </Text>
                        <InputNumber
                          value={wp.orientation.z}
                          onChange={(v) => updateWaypoint(idx, 'orientation.z', v)}
                          style={{ width: '100%' }}
                          step={0.1}
                          disabled={isPatrolling}
                          placeholder='0.0'
                        />
                      </Space>
                    </Col>
                    <Col span={6}>
                      <Space direction='vertical' size={4} style={{ width: '100%' }}>
                        <Text type='secondary' style={{ fontSize: '12px' }}>
                          W:
                        </Text>
                        <InputNumber
                          value={wp.orientation.w}
                          onChange={(v) => updateWaypoint(idx, 'orientation.w', v)}
                          style={{ width: '100%' }}
                          step={0.1}
                          disabled={isPatrolling}
                          placeholder='1.0'
                        />
                      </Space>
                    </Col>
                  </Row>
                </div>

                {/* Action Buttons */}
                <Space>
                  <Button
                    type='primary'
                    size='small'
                    onClick={() => handleGoToWaypoint(idx)}
                    disabled={!connected || isPatrolling}
                    icon={<EnvironmentOutlined />}
                  >
                    Go Here
                  </Button>
                  <Popconfirm
                    title='Delete waypoint'
                    description='Are you sure you want to delete this waypoint?'
                    onConfirm={() => removeWaypoint(idx)}
                    okText='Yes'
                    cancelText='No'
                    disabled={isPatrolling}
                  >
                    <Button danger size='small' icon={<DeleteOutlined />} disabled={isPatrolling}>
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      {/* Help Card */}
      <Card size='small'>
        <Space direction='vertical' size='small'>
          <Text strong>Tips:</Text>
          <Text type='secondary' style={{ fontSize: '12px' }}>
            • Set waypoint positions based on your robot's map coordinates
          </Text>
          <Text type='secondary' style={{ fontSize: '12px' }}>
            • Orientation uses quaternions (w=1, x=y=z=0 means no rotation)
          </Text>
          <Text type='secondary' style={{ fontSize: '12px' }}>
            • Test individual waypoints with "Go Here" before starting patrol
          </Text>
          <Text type='secondary' style={{ fontSize: '12px' }}>
            • Make sure move_base is running on your robot
          </Text>
        </Space>
      </Card>
    </Space>
  );
};
