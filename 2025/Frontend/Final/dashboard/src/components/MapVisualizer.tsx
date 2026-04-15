// import React, { useEffect, useRef, useState } from 'react';
// import { Card, Spin, Alert, BUttton, Space } from 'antd';
// import { useBackendAPI } from '../hooks/useBackendAPI'; // Assuming you can get the 'ros' instance here
// import { ReloadOutlined } from '@ant-design/icons';

// export const MapVisualizer: React.FC = () => {
//   const { ros, connected } = useBackendAPI(); // You need access to the raw 'ros' object
//   const mapContainerRef = useRef<HTMLDivElement>(null);
//   const [status, setStatus] = useState<string>('Waiting for connection...');
//   const viewerRef = useRef<any>(null);

//   useEffect(() => {
//     if (!connected || !ros || !window.ROS2D || !mapContainerRef.current) return;

//     try {
//       // 1. Create the Viewer (The Canvas)
//       // We must clear innerHTML to prevent duplicate canvases if React re-renders
//       mapContainerRef.current.innerHTML = '';

//       const viewer = new window.ROS2D.Viewer({
//         divID: mapContainerRef.current.id,
//         width: 800,
//         height: 600,
//         background: '#7f7f7f', // Standard grey for unknown areas
//       });

//       viewerRef.current = viewer;

//       // 2. Create the Map Client
//       // 'continuous: true' enables real-time updates (useful for Gmapping/SLAM)
//       const gridClient = new window.ROS2D.OccupancyGridClient({
//         ros: ros,
//         rootObject: viewer.scene,
//         continuous: true,
//       });

//       // 3. Center the map when it loads
//       gridClient.on('change', () => {
//         // Optional: Auto-scale to fit the map in the window
//         viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
//         viewer.shift(
//           gridClient.currentGrid.pose.position.x,
//           gridClient.currentGrid.pose.position.y,
//         );
//         setStatus('Map Received');
//       });

//       setStatus('Waiting for map data...');
//     } catch (error) {
//       console.error('Error initializing map:', error);
//       setStatus('Error initializing map visualization');
//     }
//   }, [ros, connected]);

//   return (
//     <Card title='Live Map Visualization'>
//       {!connected && <Alert message='Robot Disconnected' type='error' showIcon />}

//       <div style={{ textAlign: 'center', marginBottom: '10px' }}>
//         Status: <strong>{status}</strong>
//       </div>

//       <div
//         id='map-canvas'
//         ref={mapContainerRef}
//         style={{
//           width: '800px',
//           height: '600px',
//           margin: '0 auto',
//           border: '1px solid #d9d9d9',
//         }}
//       />
//     </Card>
//   );
// };

// ==========================  version 2 =================

// import { useEffect, useRef, useState } from 'react';
// import { Card, Spin, Alert, Button, Space } from 'antd';
// import { ReloadOutlined } from '@ant-design/icons';
// import { useBackendAPI } from '../hooks/useBackendAPI';

// // Extend Window interface to include ROS2D
// declare global {
//   interface Window {
//     ROS2D?: any;
//     createjs?: any;
//   }
// }

// // 1. Add this interface at the top
// interface MapVisualizerProps {
//   ros: any; // The ROS connection object
//   connected: boolean;
// }

// export const MapVisualizer: React.FC<MapVisualizerProps> = ({ ros, connected }) => {
//   // const { ros, connected } = useBackendAPI();
//   const mapContainerRef = useRef<HTMLDivElement>(null);
//   const [status, setStatus] = useState<string>('Initializing...');
//   const [error, setError] = useState<string | null>(null);
//   const viewerRef = useRef<any>(null);
//   const gridClientRef = useRef<any>(null);
//   const [librariesLoaded, setLibrariesLoaded] = useState(false);

//   // Load ROS2D libraries dynamically
//   useEffect(() => {
//     const loadLibraries = async () => {
//       try {
//         // Check if libraries are already loaded
//         if (window.createjs && window.ROS2D) {
//           setLibrariesLoaded(true);
//           setStatus('Libraries loaded');
//           return;
//         }

//         // Load EaselJS first
//         if (!window.createjs) {
//           await new Promise((resolve, reject) => {
//             const script = document.createElement('script');
//             script.src = 'https://code.createjs.com/1.0.0/easeljs.min.js';
//             script.onload = resolve;
//             script.onerror = reject;
//             document.head.appendChild(script);
//           });
//         }

//         // Load ROS2D
//         if (!window.ROS2D) {
//           await new Promise((resolve, reject) => {
//             const script = document.createElement('script');
//             script.src = 'https://cdn.jsdelivr.net/npm/ros2d@0.9.0/build/ros2d.min.js';
//             script.onload = resolve;
//             script.onerror = reject;
//             document.head.appendChild(script);
//           });
//         }

//         setLibrariesLoaded(true);
//         setStatus('Libraries loaded successfully');
//         setError(null);
//       } catch (err) {
//         console.error('Failed to load ROS2D libraries:', err);
//         setError('Failed to load visualization libraries. Please refresh the page.');
//         setStatus('Library loading failed');
//       }
//     };

//     loadLibraries();
//   }, []);

//   // Initialize map viewer when libraries are loaded and ROS is connected
//   useEffect(() => {
//     if (!librariesLoaded || !connected || !ros || !mapContainerRef.current || !window.ROS2D) {
//       if (!connected) {
//         setStatus('Waiting for robot connection...');
//       } else if (!librariesLoaded) {
//         setStatus('Loading visualization libraries...');
//       }
//       return;
//     }

//     try {
//       // Clear previous viewer
//       if (mapContainerRef.current) {
//         mapContainerRef.current.innerHTML = '';
//       }

//       // Create unique ID for the div
//       const divId = 'map-canvas-' + Date.now();
//       if (mapContainerRef.current) {
//         mapContainerRef.current.id = divId;
//       }

//       setStatus('Creating viewer...');

//       // Create the Viewer
//       const viewer = new window.ROS2D.Viewer({
//         divID: divId,
//         width: 800,
//         height: 600,
//         background: '#808080',
//       });

//       viewerRef.current = viewer;
//       setStatus('Viewer created, waiting for map data...');

//       // Create the OccupancyGrid Client
//       const gridClient = new window.ROS2D.OccupancyGridClient({
//         ros: ros,
//         rootObject: viewer.scene,
//         continuous: true,
//         topic: '/map', // Default topic for gmapping/SLAM
//       });

//       gridClientRef.current = gridClient;

//       // Handle map updates
//       gridClient.on('change', () => {
//         try {
//           if (gridClient.currentGrid) {
//             // Auto-scale to fit the map
//             viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
//             viewer.shift(
//               gridClient.currentGrid.pose.position.x,
//               gridClient.currentGrid.pose.position.y,
//             );
//             setStatus('Map received and displayed');
//             setError(null);
//           }
//         } catch (err) {
//           console.error('Error updating map view:', err);
//           setError('Error updating map display');
//         }
//       });

//       setStatus('Subscribed to /map topic, waiting for data...');
//     } catch (error: any) {
//       console.error('Error initializing map:', error);
//       setError(`Failed to initialize map: ${error.message}`);
//       setStatus('Initialization failed');
//     }

//     // Cleanup
//     return () => {
//       if (gridClientRef.current) {
//         try {
//           gridClientRef.current.unsubscribe();
//         } catch (e) {
//           console.error('Error unsubscribing:', e);
//         }
//       }
//     };
//   }, [ros, connected, librariesLoaded]);

//   const handleReset = () => {
//     setError(null);
//     setStatus('Resetting...');

//     if (mapContainerRef.current) {
//       mapContainerRef.current.innerHTML = '';
//     }

//     // Trigger re-initialization
//     if (viewerRef.current) {
//       viewerRef.current = null;
//     }
//     if (gridClientRef.current) {
//       gridClientRef.current = null;
//     }
//   };

//   return (
//     <Card
//       title='Live Map Visualization'
//       extra={
//         <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={!connected}>
//           Reset View
//         </Button>
//       }
//     >
//       <Space direction='vertical' style={{ width: '100%' }} size='large'>
//         {!connected && (
//           <Alert
//             message='Robot Disconnected'
//             description='Connect to the robot to view the map'
//             type='error'
//             showIcon
//           />
//         )}

//         {!librariesLoaded && connected && (
//           <Alert
//             message='Loading Visualization Libraries'
//             description='Please wait while map visualization libraries are loaded...'
//             type='info'
//             showIcon
//             icon={<Spin />}
//           />
//         )}

//         {error && (
//           <Alert
//             message='Map Visualization Error'
//             description={error}
//             type='error'
//             showIcon
//             closable
//             onClose={() => setError(null)}
//           />
//         )}

//         <div style={{ textAlign: 'center', marginBottom: '10px' }}>
//           <strong>Status: </strong>
//           <span style={{ color: error ? '#ff4d4f' : '#52c41a' }}>{status}</span>
//         </div>

//         <div
//           ref={mapContainerRef}
//           style={{
//             width: '800px',
//             height: '600px',
//             margin: '0 auto',
//             border: '2px solid #d9d9d9',
//             borderRadius: '8px',
//             backgroundColor: '#808080',
//             position: 'relative',
//           }}
//         >
//           {!connected && (
//             <div
//               style={{
//                 position: 'absolute',
//                 top: '50%',
//                 left: '50%',
//                 transform: 'translate(-50%, -50%)',
//                 textAlign: 'center',
//                 color: '#fff',
//               }}
//             >
//               <Spin size='large' />
//               <p style={{ marginTop: '20px' }}>Waiting for connection...</p>
//             </div>
//           )}
//         </div>

//         <Alert
//           message='Map Information'
//           description={
//             <ul style={{ margin: 0, paddingLeft: '20px' }}>
//               <li>Make sure gmapping or slam_gmapping is running on your robot</li>
//               <li>The map will update in real-time as SLAM builds the map</li>
//               <li>Gray areas = unknown, White = free space, Black = obstacles</li>
//               <li>
//                 Run: <code>roslaunch turtlebot_navigation gmapping_demo.launch</code>
//               </li>
//             </ul>
//           }
//           type='info'
//           showIcon
//         />
//       </Space>
//     </Card>
//   );
// };

// ==========================  version 3 =================

// import React, { useEffect, useRef, useState } from 'react';
// import { Card, Spin, Alert, Space, Typography } from 'antd';
// // Removed useBackendAPI since we are getting props from parent now
// // import { useBackendAPI } from '../hooks/useBackendAPI';

// const { Text } = Typography;

// // 1. Define the props interface
// interface MapVisualizerProps {
//   ros: any; // The ROS connection object passed from TurtlebotPage
//   connected: boolean;
// }

// export const MapVisualizer: React.FC<MapVisualizerProps> = ({ ros, connected }) => {
//   const mapContainerRef = useRef<HTMLDivElement>(null);
//   const viewerRef = useRef<any>(null);
//   const gridClientRef = useRef<any>(null);
//   const [status, setStatus] = useState<string>('Waiting for connection...');

//   useEffect(() => {
//     // Safety check: ensure we have a connection and the library is loaded
//     if (!connected || !ros || !window.ROS2D || !mapContainerRef.current) {
//       if (!connected) setStatus('Waiting for robot connection...');
//       return;
//     }

//     try {
//       setStatus('Initializing map viewer...');

//       // ---------------------------------------------------------
//       // 1. Clean up previous instances to prevent duplicates
//       // ---------------------------------------------------------
//       if (viewerRef.current) {
//         // There isn't a strict "destroy" method in some versions,
//         // but clearing innerHTML handles the canvas removal.
//         mapContainerRef.current.innerHTML = '';
//       }

//       // ---------------------------------------------------------
//       // 2. Create the Viewer (The Canvas)
//       // ---------------------------------------------------------
//       const viewer = new window.ROS2D.Viewer({
//         divID: mapContainerRef.current.id,
//         // divID: 'map-canvas-div', // Using a fixed ID since we clear innerHTML
//         width: 800,
//         height: 600,
//         background: '#7f7f7f', // Grey for unknown areas
//       });

//       viewerRef.current = viewer;

//       // ---------------------------------------------------------
//       // 3. Create the Map Client (Connects ROS map to Viewer)
//       // ---------------------------------------------------------
//       const gridClient = new window.ROS2D.OccupancyGridClient({
//         ros: ros,
//         rootObject: viewer.scene,
//         // Use 'true' for continuous updates (SLAM/Gmapping)
//         // Use 'false' if you just have a static saved map
//         continuous: true,
//       });

//       // Scale the view to fit the map once it loads
//       gridClient.on('change', () => {
//         viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
//         viewer.shift(
//           gridClient.currentGrid.pose.position.x,
//           gridClient.currentGrid.pose.position.y,
//         );
//         setStatus('Map Active');
//       });

//       gridClientRef.current = gridClient;
//     } catch (error) {
//       console.error('Error initializing map:', error);
//       setStatus('Error loading map visualizer');
//     }

//     // Cleanup function when component unmounts or connection is lost
//     return () => {
//       // Logic to cleanup if necessary
//       // Usually clearing innerHTML on next render is sufficient for ROS2D
//     };
//   }, [connected, ros]); // Re-run this if connection status changes

//   return (
//     <Card title='Map Visualization'>
//       <Space direction='vertical' style={{ width: '100%' }}>
//         <div style={{ textAlign: 'center', marginBottom: '10px' }}>
//           <Text strong>Status: </Text>
//           <Text type={status === 'Map Active' ? 'success' : 'warning'}>{status}</Text>
//         </div>

//         <div
//           id='map-canvas-div' // Important: Needs an ID for ROS2D
//           ref={mapContainerRef}
//           style={{
//             width: '800px',
//             height: '600px',
//             margin: '0 auto',
//             border: '2px solid #d9d9d9',
//             borderRadius: '8px',
//             backgroundColor: '#808080',
//             position: 'relative',
//             overflow: 'hidden',
//           }}
//         >
//           {!connected && (
//             <div
//               style={{
//                 position: 'absolute',
//                 top: '50%',
//                 left: '50%',
//                 transform: 'translate(-50%, -50%)',
//                 textAlign: 'center',
//                 color: '#fff',
//               }}
//             >
//               <Spin size='large' />
//               <p style={{ marginTop: '20px' }}>Waiting for connection...</p>
//             </div>
//           )}
//         </div>

//         <Alert
//           message='Map Information'
//           description={
//             <ul style={{ margin: 0, paddingLeft: '20px' }}>
//               <li>
//                 Make sure <b>tf2_web_republisher</b> is running on the robot.
//               </li>
//               <li>Gray areas = unknown, White = free space, Black = obstacles</li>
//               <li>
//                 Run on robot: <code>rosrun tf2_web_republisher tf2_web_republisher</code>
//               </li>
//             </ul>
//           }
//           type='info'
//           showIcon
//         />
//       </Space>
//     </Card>
//   );
// };

// ==================== version 4 ===================

// import React, { useEffect, useRef, useState } from 'react';
// import { Card, Spin, Alert, Space, Typography, Button } from 'antd';

// const { Text } = Typography;

// interface MapVisualizerProps {
//   ros: any;
//   connected: boolean;
// }

// export const MapVisualizer: React.FC<MapVisualizerProps> = ({ ros, connected }) => {
//   const mapContainerRef = useRef<HTMLDivElement>(null);
//   const viewerRef = useRef<any>(null);
//   const gridClientRef = useRef<any>(null);
//   const [status, setStatus] = useState<string>('Waiting for connection...');
//   const [debugInfo, setDebugInfo] = useState<string[]>([]);

//   const addDebug = (message: string) => {
//     console.log('[MapVisualizer]', message);
//     setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
//   };

//   useEffect(() => {
//     addDebug('Effect triggered');
//     addDebug(`Connected: ${connected}`);
//     addDebug(`ROS object exists: ${!!ros}`);
//     addDebug(`ROS2D library exists: ${!!window.ROS2D}`);
//     addDebug(`Container ref exists: ${!!mapContainerRef.current}`);

//     // Check all dependencies
//     if (!connected) {
//       setStatus('Waiting for robot connection...');
//       addDebug('Not connected - exiting');
//       return;
//     }

//     if (!ros) {
//       setStatus('ROS object not available');
//       addDebug('ROS object is null/undefined');
//       return;
//     }

//     if (!window.ROS2D) {
//       setStatus('ROS2D library not loaded');
//       addDebug('window.ROS2D is undefined - library not loaded');
//       return;
//     }

//     if (!mapContainerRef.current) {
//       setStatus('Container not ready');
//       addDebug('mapContainerRef.current is null');
//       return;
//     }

//     try {
//       setStatus('Initializing map viewer...');
//       addDebug('Starting initialization');

//       // Clean up previous instances
//       if (viewerRef.current) {
//         addDebug('Cleaning up previous viewer');
//         mapContainerRef.current.innerHTML = '';
//         viewerRef.current = null;
//         gridClientRef.current = null;
//       }

//       // Check ROS connection state
//       if (ros.isConnected) {
//         addDebug('ROS is connected');
//       } else {
//         addDebug('WARNING: ROS object exists but isConnected is false');
//       }

//       // Create the Viewer
//       addDebug('Creating ROS2D.Viewer...');
//       const viewer = new window.ROS2D.Viewer({
//         divID: 'map-canvas-div',
//         width: 800,
//         height: 600,
//         background: '#7f7f7f',
//       });
//       addDebug('Viewer created successfully');
//       viewerRef.current = viewer;

//       // Create the Map Client
//       addDebug('Creating OccupancyGridClient...');
//       const gridClient = new window.ROS2D.OccupancyGridClient({
//         ros: ros,
//         rootObject: viewer.scene,
//         continuous: true,
//         topic: '/map', // Explicitly set the topic
//       });
//       addDebug('OccupancyGridClient created');
//       gridClientRef.current = gridClient;

//       // Listen for map updates
//       gridClient.on('change', () => {
//         addDebug('Map data received!');
//         if (gridClient.currentGrid) {
//           addDebug(
//             `Grid dimensions: ${gridClient.currentGrid.width}x${gridClient.currentGrid.height}`,
//           );
//           viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
//           viewer.shift(
//             gridClient.currentGrid.pose.position.x,
//             gridClient.currentGrid.pose.position.y,
//           );
//           setStatus('Map Active ✓');
//         }
//       });

//       setStatus('Waiting for map data...');
//       addDebug('Setup complete, waiting for /map topic data');
//     } catch (error) {
//       const errorMsg = error instanceof Error ? error.message : String(error);
//       console.error('Error initializing map:', error);
//       addDebug(`ERROR: ${errorMsg}`);
//       setStatus(`Error: ${errorMsg}`);
//     }

//     return () => {
//       addDebug('Cleanup triggered');
//       if (mapContainerRef.current) {
//         mapContainerRef.current.innerHTML = '';
//       }
//     };
//   }, [connected, ros]);

//   const handleTestConnection = () => {
//     addDebug('=== Manual Connection Test ===');
//     addDebug(`window.ROS2D: ${typeof window.ROS2D}`);
//     addDebug(`ros: ${typeof ros}`);
//     if (ros) {
//       addDebug(`ros.isConnected: ${ros.isConnected}`);
//       addDebug(`ros constructor: ${ros.constructor.name}`);
//     }
//   };

//   return (
//     <Card title='Map Visualization'>
//       <Space direction='vertical' style={{ width: '100%' }}>
//         <div style={{ textAlign: 'center', marginBottom: '10px' }}>
//           <Text strong>Status: </Text>
//           <Text type={status === 'Map Active ✓' ? 'success' : 'warning'}>{status}</Text>
//         </div>

//         <Button onClick={handleTestConnection} type='default' size='small'>
//           Test Connection
//         </Button>

//         <div
//           id='map-canvas-div'
//           ref={mapContainerRef}
//           style={{
//             width: '800px',
//             height: '600px',
//             margin: '0 auto',
//             border: '2px solid #d9d9d9',
//             borderRadius: '8px',
//             backgroundColor: '#808080',
//             position: 'relative',
//             overflow: 'hidden',
//           }}
//         >
//           {!connected && (
//             <div
//               style={{
//                 position: 'absolute',
//                 top: '50%',
//                 left: '50%',
//                 transform: 'translate(-50%, -50%)',
//                 textAlign: 'center',
//                 color: '#fff',
//               }}
//             >
//               <Spin size='large' />
//               <p style={{ marginTop: '20px' }}>Waiting for connection...</p>
//             </div>
//           )}
//         </div>

//         <Alert
//           message='Map Information'
//           description={
//             <ul style={{ margin: 0, paddingLeft: '20px' }}>
//               <li>
//                 Make sure <b>tf2_web_republisher</b> is running on the robot.
//               </li>
//               <li>Gray areas = unknown, White = free space, Black = obstacles</li>
//               <li>
//                 Run on robot: <code>rosrun tf2_web_republisher tf2_web_republisher</code>
//               </li>
//               <li>
//                 Map topic: <code>/map</code>
//               </li>
//             </ul>
//           }
//           type='info'
//           showIcon
//         />

//         {/* Debug Panel */}
//         <Card title='Debug Log' size='small' style={{ maxHeight: '200px', overflow: 'auto' }}>
//           <pre style={{ fontSize: '11px', margin: 0 }}>{debugInfo.slice(-15).join('\n')}</pre>
//         </Card>
//       </Space>
//     </Card>
//   );
// };

// ==================== version 5 (with diagnostics) ===================

import React, { useEffect, useRef, useState } from 'react';
import { Card, Spin, Alert, Space, Typography, Button } from 'antd';

const { Text } = Typography;

interface MapVisualizerProps {
  ros: any;
  connected: boolean;
}

export const MapVisualizer: React.FC<MapVisualizerProps> = ({ ros, connected }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const gridClientRef = useRef<any>(null);
  const [status, setStatus] = useState<string>('Waiting for connection...');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [isRosReady, setIsRosReady] = useState(false);

  const addDebug = (message: string) => {
    console.log('[MapVisualizer]', message);
    setDebugInfo((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Check ROS connection status every second
  useEffect(() => {
    const checkConnection = () => {
      if (ros && ros.isConnected && ros.isConnected()) {
        setIsRosReady(true);
        addDebug('ROS connection detected via polling');
      } else {
        setIsRosReady(false);
      }
    };

    // Check immediately
    checkConnection();

    // Then check every second
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, [ros]);

  useEffect(() => {
    addDebug('Effect triggered');
    addDebug(`Connected prop: ${connected}`);
    addDebug(`ROS object exists: ${!!ros}`);
    addDebug(`ROS isConnected: ${ros && ros.isConnected ? ros.isConnected() : 'N/A'}`);
    addDebug(`isRosReady state: ${isRosReady}`);
    addDebug(`ROS2D library exists: ${!!window.ROS2D}`);
    addDebug(`Container ref exists: ${!!mapContainerRef.current}`);

    // Use isRosReady instead of connected prop
    const actuallyConnected = isRosReady && ros;

    if (!actuallyConnected) {
      if (!ros) {
        setStatus('Waiting for ROS object...');
        addDebug('ROS object not available - exiting');
      } else if (!isRosReady) {
        setStatus('ROS not connected yet...');
        addDebug('ROS exists but not connected - exiting');
      }
      return;
    }

    if (!window.ROS2D) {
      setStatus('ROS2D library not loaded');
      addDebug('window.ROS2D is undefined - library not loaded');
      return;
    }

    if (!mapContainerRef.current) {
      setStatus('Container not ready');
      addDebug('mapContainerRef.current is null');
      return;
    }

    try {
      setStatus('Initializing map viewer...');
      addDebug('Starting initialization');

      // Clean up previous instances
      if (viewerRef.current) {
        addDebug('Cleaning up previous viewer');
        mapContainerRef.current.innerHTML = '';
        viewerRef.current = null;
        gridClientRef.current = null;
      }

      // Create the Viewer
      addDebug('Creating ROS2D.Viewer...');
      const viewer = new window.ROS2D.Viewer({
        divID: 'map-canvas-div',
        width: 800,
        height: 600,
        background: '#7f7f7f',
      });
      addDebug('Viewer created successfully');
      viewerRef.current = viewer;

      // Create the Map Client
      addDebug('Creating OccupancyGridClient...');
      const gridClient = new window.ROS2D.OccupancyGridClient({
        ros: ros,
        rootObject: viewer.scene,
        continuous: true,
        topic: '/map',
      });
      addDebug('OccupancyGridClient created');
      gridClientRef.current = gridClient;

      // Listen for map updates
      gridClient.on('change', () => {
        addDebug('Map data received!');
        if (gridClient.currentGrid) {
          addDebug(
            `Grid dimensions: ${gridClient.currentGrid.width}x${gridClient.currentGrid.height}`,
          );
          viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
          viewer.shift(
            gridClient.currentGrid.pose.position.x,
            gridClient.currentGrid.pose.position.y,
          );
          setStatus('Map Active ✓');
        }
      });

      setStatus('Waiting for map data...');
      addDebug('Setup complete, waiting for /map topic data');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error initializing map:', error);
      addDebug(`ERROR: ${errorMsg}`);
      setStatus(`Error: ${errorMsg}`);
    }

    return () => {
      addDebug('Cleanup triggered');
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
      }
    };
  }, [isRosReady, ros]);

  const handleTestConnection = () => {
    addDebug('=== Manual Connection Test ===');
    addDebug(`window.ROS2D: ${typeof window.ROS2D}`);
    addDebug(`ros: ${typeof ros}`);
    if (ros) {
      addDebug(`ros.isConnected: ${typeof ros.isConnected}`);
      if (typeof ros.isConnected === 'function') {
        addDebug(`ros.isConnected(): ${ros.isConnected()}`);
      }
      addDebug(`ros constructor: ${ros.constructor.name}`);
    }
    addDebug(`connected prop: ${connected}`);
    addDebug(`isRosReady: ${isRosReady}`);
  };

  return (
    <Card title='Map Visualization'>
      <Space direction='vertical' style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <Text strong>Status: </Text>
          <Text type={status === 'Map Active ✓' ? 'success' : 'warning'}>{status}</Text>
          <br />
          <Text type='secondary' style={{ fontSize: '12px' }}>
            Connected Prop: {connected ? '✓' : '✗'} | ROS Ready: {isRosReady ? '✓' : '✗'}
          </Text>
        </div>

        <Button onClick={handleTestConnection} type='default' size='small'>
          Test Connection
        </Button>

        <div
          id='map-canvas-div'
          ref={mapContainerRef}
          style={{
            width: '800px',
            height: '600px',
            margin: '0 auto',
            border: '2px solid #d9d9d9',
            borderRadius: '8px',
            backgroundColor: '#808080',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {!isRosReady && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: '#fff',
              }}
            >
              <Spin size='large' />
              <p style={{ marginTop: '20px' }}>Waiting for ROS connection...</p>
            </div>
          )}
        </div>

        <Alert
          message='Map Information'
          description={
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>
                Make sure <b>rosbridge_websocket</b> is running on robot
              </li>
              <li>
                Make sure <b>tf2_web_republisher</b> is running on robot
              </li>
              <li>Make sure mapping/SLAM is active or a map is loaded</li>
              <li>
                Run: <code>roslaunch rosbridge_server rosbridge_websocket.launch</code>
              </li>
              <li>
                Run: <code>rosrun tf2_web_republisher tf2_web_republisher</code>
              </li>
              <li>
                Run: <code>roslaunch turtlebot_navigation gmapping_demo.launch</code>
              </li>
            </ul>
          }
          type='info'
          showIcon
        />

        {/* Debug Panel */}
        <Card title='Debug Log' size='small' style={{ maxHeight: '200px', overflow: 'auto' }}>
          <pre style={{ fontSize: '11px', margin: 0 }}>{debugInfo.slice(-20).join('\n')}</pre>
        </Card>
      </Space>
    </Card>
  );
};
