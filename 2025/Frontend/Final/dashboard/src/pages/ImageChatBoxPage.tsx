// import React, { useState, useRef, useEffect } from 'react';
// import {
//   Layout,
//   Input,
//   Button,
//   Upload,
//   Card,
//   Avatar,
//   Typography,
//   Space,
//   Badge,
//   Popconfirm,
//   message,
//   Spin,
//   Select,
//   Tooltip,
//   Alert,
// } from 'antd';
// import {
//   SendOutlined,
//   PictureOutlined,
//   UserOutlined,
//   RobotOutlined,
//   DeleteOutlined,
//   CloseOutlined,
//   ReloadOutlined,
//   InfoCircleOutlined,
// } from '@ant-design/icons';

// const { Header, Content, Footer } = Layout;
// const { TextArea } = Input;
// const { Text, Title } = Typography;
// const { Option } = Select;

// interface Message {
//   ids: number;
//   type: 'user' | 'assistant';
//   content: string;
//   image?: {
//     url: string;
//     file: File;
//   };
//   timestamp: Date;
//   modelUsed?: string;
// }

// interface ModelInfo {
//   name: string;
//   type: 'text' | 'multimodal';
//   package: string;
// }

// interface ConnectionStatus {
//   status: 'connected' | 'disconnected' | 'checking';
//   availableModels: ModelInfo[];
//   totalModels: number;
//   missingApiKeys: string[];
// }

// const ImageChatBoxPage: React.FC = () => {
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       ids: 2,
//       type: 'assistant',
//       content:
//         'Hello! I can help you with text questions and analyze images you upload. What would you like to know?',
//       timestamp: new Date(),
//     },
//   ]);

//   const [inputText, setInputText] = useState('');
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [conversationId] = useState('default');
//   const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
//     status: 'checking',
//     availableModels: [],
//     totalModels: 0,
//     missingApiKeys: [],
//   });
//   const [selectedModel, setSelectedModel] = useState('');

//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const API_BASE_URL = 'http://localhost:5000/api';

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   useEffect(() => {
//     checkBackendConnection();
//   }, []);

//   const checkBackendConnection = async () => {
//     setConnectionStatus((prev) => ({ ...prev, status: 'checking' }));

//     try {
//       const response = await fetch(`${API_BASE_URL}/health`);
//       if (response.ok) {
//         const data = await response.json();
//         const newStatus: ConnectionStatus = {
//           status: 'connected',
//           availableModels: data.available_models || [],
//           totalModels: data.total_models || 0,
//           missingApiKeys: data.missing_api_keys || [],
//         };

//         setConnectionStatus(newStatus);

//         // Set default model if none selected
//         if (!selectedModel && newStatus.availableModels.length > 0) {
//           const defaultModel =
//             newStatus.availableModels.find((m) => m.type === 'multimodal') ||
//             newStatus.availableModels[0];
//           setSelectedModel(defaultModel.name);
//         }

//         if (newStatus.missingApiKeys.length > 0) {
//           message.warning(
//             `Some models unavailable due to missing API keys: ${newStatus.missingApiKeys.join(
//               ', ',
//             )}`,
//           );
//         }
//       } else {
//         setConnectionStatus((prev) => ({
//           ...prev,
//           status: 'disconnected',
//           availableModels: [],
//           totalModels: 0,
//         }));
//       }
//     } catch (error) {
//       console.error('Backend connection failed:', error);
//       setConnectionStatus((prev) => ({
//         ...prev,
//         status: 'disconnected',
//         availableModels: [],
//         totalModels: 0,
//       }));
//     }
//   };

//   const handleImageSelect = (file: File) => {
//     const maxSize = 16 * 1024 * 1024; // 16MB
//     const allowedTypes = [
//       'image/png',
//       'image/jpg',
//       'image/jpeg',
//       'image/gif',
//       'image/bmp',
//       'image/webp',
//     ];

//     if (!allowedTypes.includes(file.type)) {
//       message.error('Please select a valid image file (PNG, JPG, JPEG, GIF, BMP, WEBP)');
//       return false;
//     }

//     if (file.size > maxSize) {
//       message.error('File size must be less than 16MB');
//       return false;
//     }

//     // Check if selected model supports images
//     const currentModel = connectionStatus.availableModels.find((m) => m.name === selectedModel);
//     if (currentModel && currentModel.type !== 'multimodal') {
//       message.warning(
//         'Selected model does not support image analysis. Please choose a multimodal model.',
//       );
//       return false;
//     }

//     setSelectedImage(file);
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       if (e.target?.result) {
//         setImagePreview(e.target.result as string);
//       }
//     };
//     reader.readAsDataURL(file);
//     return false;
//   };

//   const removeSelectedImage = () => {
//     setSelectedImage(null);
//     setImagePreview(null);
//   };

//   const sendMessage = async () => {
//     if (!inputText.trim() && !selectedImage) {
//       message.warning('Please enter a message or select an image');
//       return;
//     }

//     if (connectionStatus.status !== 'connected') {
//       message.error('Backend server is not connected. Please check if the server is running.');
//       return;
//     }

//     if (!selectedModel) {
//       message.error('Please select a model');
//       return;
//     }

//     const messageText = inputText || 'Please analyze this image.';
//     const userMessage: Message = {
//       ids: Date.now(),
//       type: 'user',
//       content: messageText,
//       image: selectedImage
//         ? {
//             url: imagePreview!,
//             file: selectedImage,
//           }
//         : undefined,
//       timestamp: new Date(),
//     };

//     setMessages((prev) => [...prev, userMessage]);
//     setInputText('');
//     setIsLoading(true);

//     try {
//       let response: Response;

//       if (selectedImage) {
//         // Image + text request
//         const formData = new FormData();
//         formData.append('image', selectedImage);
//         formData.append('message', messageText);
//         formData.append('model', selectedModel);

//         response = await fetch(`${API_BASE_URL}/chat`, {
//           method: 'POST',
//           body: formData,
//         });
//       } else {
//         // Text-only request
//         response = await fetch(`${API_BASE_URL}/chat`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             message: messageText,
//             conversation_id: conversationId,
//             model: selectedModel,
//           }),
//         });
//       }

//       if (!response.ok) {
//         const errorData = await response.json().catch(() => ({}));
//         throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();

//       const assistantMessage: Message = {
//         ids: Date.now() + 1,
//         type: 'assistant',
//         content: data.response,
//         timestamp: new Date(),
//         modelUsed: data.model_used || selectedModel,
//       };

//       setMessages((prev) => [...prev, assistantMessage]);
//       message.success('Message sent successfully');
//     } catch (error) {
//       console.error('Error sending message:', error);
//       const errorMessage: Message = {
//         ids: Date.now() + 1,
//         type: 'assistant',
//         content: `Sorry, I encountered an error: ${
//           error instanceof Error ? error.message : 'Unknown error'
//         }. Please check the backend server and try again.`,
//         timestamp: new Date(),
//       };
//       setMessages((prev) => [...prev, errorMessage]);
//       message.error('Failed to send message');
//     } finally {
//       setIsLoading(false);
//       removeSelectedImage();
//     }
//   };

//   const clearConversation = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
//         method: 'DELETE',
//       });

//       if (!response.ok) {
//         throw new Error('Failed to clear conversation');
//       }

//       setMessages([
//         {
//           ids: Date.now(),
//           type: 'assistant',
//           content:
//             'Hello! I can help you with text questions and analyze images you upload. What would you like to know?',
//           timestamp: new Date(),
//         },
//       ]);
//       message.success('Conversation cleared');
//     } catch (error) {
//       console.error('Error clearing conversation:', error);
//       message.error('Failed to clear conversation');
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const formatTime = (date: Date) => {
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   const getStatusBadge = () => {
//     const statusConfig = {
//       connected: { status: 'success' as const, text: 'Connected' },
//       disconnected: { status: 'error' as const, text: 'Disconnected' },
//       checking: { status: 'processing' as const, text: 'Checking...' },
//     };

//     const config = statusConfig[connectionStatus.status];
//     const modelInfo = selectedModel ? ` (${selectedModel})` : '';

//     return (
//       <Tooltip title={`${connectionStatus.totalModels} models available`}>
//         <Badge status={config.status} text={`${config.text}${modelInfo}`} />
//       </Tooltip>
//     );
//   };

//   const getModelTypeIcon = (type: string) => {
//     return type === 'multimodal' ? '🖼️' : '📝';
//   };

//   const getCurrentModelType = () => {
//     const currentModel = connectionStatus.availableModels.find((m) => m.name === selectedModel);
//     return currentModel?.type || 'unknown';
//   };

//   return (
//     <Layout style={{ height: '100vh' }}>
//       <Header
//         style={{
//           backgroundColor: '#fff',
//           borderBottom: '1px solid #f0f0f0',
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           padding: '0 24px',
//         }}
//       >
//         <div>
//           <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
//             AI Chat Assistant
//           </Title>
//           <Text type='secondary'>Multi-model AI Assistant</Text>
//         </div>

//         <Space>
//           <Select
//             value={selectedModel}
//             style={{ width: 200 }}
//             onChange={(value) => setSelectedModel(value)}
//             disabled={isLoading || connectionStatus.status !== 'connected'}
//             placeholder='Select a model'
//             loading={connectionStatus.status === 'checking'}
//           >
//             {connectionStatus.availableModels.map((model) => (
//               <Option key={model.name} value={model.name}>
//                 <Space>
//                   <span>{getModelTypeIcon(model.type)}</span>
//                   <span>{model.name}</span>
//                   <Text type='secondary' style={{ fontSize: '12px' }}>
//                     ({model.type})
//                   </Text>
//                 </Space>
//               </Option>
//             ))}
//           </Select>

//           <Tooltip title='Refresh connection'>
//             <Button
//               icon={<ReloadOutlined />}
//               onClick={checkBackendConnection}
//               loading={connectionStatus.status === 'checking'}
//             />
//           </Tooltip>

//           {getStatusBadge()}

//           <Popconfirm
//             title='Clear conversation'
//             description='Are you sure you want to clear all messages?'
//             onConfirm={clearConversation}
//             okText='Yes'
//             cancelText='No'
//           >
//             <Button type='text' icon={<DeleteOutlined />} danger>
//               Clear
//             </Button>
//           </Popconfirm>
//         </Space>
//       </Header>

//       <Content
//         style={{
//           padding: '24px',
//           overflowY: 'auto',
//           backgroundColor: '#f5f5f5',
//           flex: 1,
//         }}
//       >
//         {connectionStatus.missingApiKeys.length > 0 && (
//           <Alert
//             message='Some API keys are missing'
//             description={`The following models are unavailable: ${connectionStatus.missingApiKeys.join(
//               ', ',
//             )}`}
//             type='warning'
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />
//         )}

//         {connectionStatus.status === 'disconnected' && (
//           <Alert
//             message='Backend server disconnected'
//             description='Cannot connect to backend server. Make sure the server is running on http://localhost:5000'
//             type='error'
//             showIcon
//             style={{ marginBottom: '16px' }}
//             action={
//               <Button size='small' onClick={checkBackendConnection}>
//                 Retry
//               </Button>
//             }
//           />
//         )}

//         <div style={{ maxWidth: '800px', margin: '0 auto' }}>
//           <Space direction='vertical' size='middle' style={{ width: '100%' }}>
//             {messages.map((message) => (
//               <Card
//                 key={message.ids}
//                 style={{
//                   marginLeft: message.type === 'user' ? '20%' : '0',
//                   marginRight: message.type === 'assistant' ? '20%' : '0',
//                 }}
//                 styles={{ body: { padding: '12px 16px' } }}
//               >
//                 <Space align='start'>
//                   <Avatar
//                     icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
//                     style={{
//                       backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a',
//                     }}
//                   />
//                   <div style={{ flex: 1 }}>
//                     {message.image && (
//                       <div style={{ marginBottom: '8px' }}>
//                         <img
//                           src={message.image.url}
//                           alt='Uploaded'
//                           style={{
//                             maxWidth: '200px',
//                             maxHeight: '200px',
//                             borderRadius: '8px',
//                             objectFit: 'cover',
//                           }}
//                         />
//                       </div>
//                     )}
//                     <Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
//                     <div
//                       style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}
//                     >
//                       <Text type='secondary' style={{ fontSize: '12px' }}>
//                         {formatTime(message.timestamp)}
//                       </Text>
//                       {message.modelUsed && (
//                         <Text type='secondary' style={{ fontSize: '12px' }}>
//                           {message.modelUsed}
//                         </Text>
//                       )}
//                     </div>
//                   </div>
//                 </Space>
//               </Card>
//             ))}

//             {isLoading && (
//               <Card style={{ marginRight: '20%' }} styles={{ body: { padding: '12px 16px' } }}>
//                 <Space align='start'>
//                   <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
//                   <Space>
//                     <Spin size='small' />
//                     <Text type='secondary'>Processing...</Text>
//                   </Space>
//                 </Space>
//               </Card>
//             )}
//           </Space>
//           <div ref={messagesEndRef} />
//         </div>
//       </Content>

//       <Footer
//         style={{
//           backgroundColor: '#fff',
//           borderTop: '1px solid #f0f0f0',
//           padding: '16px 24px',
//         }}
//       >
//         <div style={{ maxWidth: '800px', margin: '0 auto' }}>
//           {imagePreview && (
//             <div style={{ marginBottom: '12px' }}>
//               <Card
//                 size='small'
//                 style={{ display: 'inline-block', position: 'relative' }}
//                 styles={{ body: { padding: '8px' } }}
//               >
//                 <img
//                   src={imagePreview}
//                   alt='Preview'
//                   style={{
//                     width: '60px',
//                     height: '60px',
//                     objectFit: 'cover',
//                     borderRadius: '4px',
//                   }}
//                 />
//                 <Button
//                   type='text'
//                   size='small'
//                   icon={<CloseOutlined />}
//                   onClick={removeSelectedImage}
//                   style={{
//                     position: 'absolute',
//                     top: '-8px',
//                     right: '-8px',
//                     backgroundColor: '#ff4d4f',
//                     color: 'white',
//                     borderRadius: '50%',
//                     width: '20px',
//                     height: '20px',
//                     minWidth: '20px',
//                     padding: 0,
//                   }}
//                 />
//               </Card>
//             </div>
//           )}

//           <Space.Compact style={{ width: '100%' }}>
//             <Upload
//               beforeUpload={handleImageSelect}
//               showUploadList={false}
//               accept='image/*'
//               disabled={isLoading || connectionStatus.status !== 'connected'}
//             >
//               <Tooltip
//                 title={
//                   getCurrentModelType() === 'multimodal'
//                     ? 'Upload image for analysis'
//                     : 'Select a multimodal model to upload images'
//                 }
//               >
//                 <Button
//                   icon={<PictureOutlined />}
//                   disabled={
//                     isLoading ||
//                     connectionStatus.status !== 'connected' ||
//                     getCurrentModelType() !== 'multimodal'
//                   }
//                 >
//                   Image
//                 </Button>
//               </Tooltip>
//             </Upload>

//             <TextArea
//               value={inputText}
//               onChange={(e) => setInputText(e.target.value)}
//               onKeyDown={handleKeyPress}
//               placeholder='Type your message... (Shift+Enter for new line)'
//               autoSize={{ minRows: 1, maxRows: 4 }}
//               disabled={isLoading || connectionStatus.status !== 'connected'}
//               style={{ flex: 1 }}
//             />

//             <Button
//               type='primary'
//               icon={<SendOutlined />}
//               onClick={sendMessage}
//               disabled={
//                 (!inputText.trim() && !selectedImage) ||
//                 isLoading ||
//                 connectionStatus.status !== 'connected' ||
//                 !selectedModel
//               }
//               loading={isLoading}
//             >
//               Send
//             </Button>
//           </Space.Compact>

//           <div style={{ marginTop: '8px', textAlign: 'center' }}>
//             <Space split={<span>•</span>}>
//               <Text type='secondary' style={{ fontSize: '12px' }}>
//                 {getCurrentModelType() === 'multimodal'
//                   ? 'Upload images for analysis or ask questions'
//                   : 'Text-only model selected'}
//               </Text>
//               <Text type='secondary' style={{ fontSize: '12px' }}>
//                 Enter to send, Shift+Enter for new line
//               </Text>
//               {connectionStatus.totalModels > 0 && (
//                 <Text type='secondary' style={{ fontSize: '12px' }}>
//                   {connectionStatus.totalModels} models available
//                 </Text>
//               )}
//             </Space>
//           </div>
//         </div>
//       </Footer>
//     </Layout>
//   );
// };

// export default ImageChatBoxPage;

// ----------------------------------- Version 2 with Ant design -----------------------------------
// import React, { useState, useRef, useEffect } from 'react';
// import {
//   Layout,
//   Input,
//   Button,
//   Upload,
//   Card,
//   Avatar,
//   Typography,
//   Space,
//   Badge,
//   Popconfirm,
//   message,
//   Spin,
//   Divider,
//   Col,
//   Row,
//   Select,
// } from 'antd';
// import {
//   SendOutlined,
//   PictureOutlined,
//   UserOutlined,
//   RobotOutlined,
//   DeleteOutlined,
//   CloseOutlined,
// } from '@ant-design/icons';

// const { Header, Content, Footer } = Layout;
// const { TextArea } = Input;
// const { Text, Title } = Typography;
// const { Option } = Select;

// interface Message {
//   ids: number;
//   type: 'user' | 'assistant';
//   content: string;
//   image?: {
//     url: string;
//     file: File;
//   };
//   timestamp: Date;
// }

// interface ConnectionStatus {
//   status: 'connected' | 'disconnected' | 'checking';
//   model?: string;
// }

// const ImageChatBoxPage: React.FC = () => {
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       ids: 2,
//       type: 'assistant',
//       content:
//         "Hello! I can help you with text questions and analyze images you upload. I'm powered by Hugging Face multimodal models. What would you like to know?",
//       timestamp: new Date(),
//     },
//   ]);

//   const [inputText, setInputText] = useState('');
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [conversationId] = useState('default');
//   const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
//     status: 'checking',
//   });
//   const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const API_BASE_URL = 'http://localhost:5000/api';

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   useEffect(() => {
//     checkBackendConnection();
//   }, []);

//   const checkBackendConnection = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/health`);
//       if (response.ok) {
//         const data = await response.json();
//         setConnectionStatus({
//           status: 'connected',
//           model: data.model || 'Unknown',
//         });
//       } else {
//         setConnectionStatus({ status: 'disconnected' });
//       }
//     } catch (error) {
//       setConnectionStatus({ status: 'disconnected' });
//     }
//   };

//   const handleImageSelect = (file: File) => {
//     if (file && file.type.startsWith('image/')) {
//       setSelectedImage(file);
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         if (e.target?.result) {
//           setImagePreview(e.target.result as string);
//         }
//       };
//       reader.readAsDataURL(file);
//       return false; // Prevent default upload behavior
//     }
//     message.error('Please select a valid image file');
//     return false;
//   };

//   const removeSelectedImage = () => {
//     setSelectedImage(null);
//     setImagePreview(null);
//   };

//   const sendTextMessage = async (message: string) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/chat`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           message: message,
//           // eslint-disable-next-line camelcase
//           conversation_id: conversationId,
//           model: selectedModel,
//         }),
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return data.response;
//     } catch (error) {
//       console.error('Error sending text message:', error);
//       throw error;
//     }
//   };

//   const sendImageMessage = async (message: string, imageFile: File) => {
//     try {
//       const formData = new FormData();
//       formData.append('image', imageFile);
//       formData.append('message', message);
//       formData.append('conversation_id', conversationId);
//       formData.append('model', selectedModel);

//       const response = await fetch(`${API_BASE_URL}/chat/image`, {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return data.response;
//     } catch (error) {
//       console.error('Error sending image message:', error);
//       throw error;
//     }
//   };

//   const sendMessage = async () => {
//     if (!inputText.trim() && !selectedImage) {
//       message.warning('Please enter a message or select an image');
//       return;
//     }

//     if (connectionStatus.status !== 'connected') {
//       message.error('Backend server is not connected. Please check if the server is running.');
//       return;
//     }

//     const messageText = inputText || 'Please analyze this image.';
//     const userMessage: Message = {
//       ids: Date.now(),
//       type: 'user',
//       content: messageText,
//       image: selectedImage
//         ? {
//             url: imagePreview!,
//             file: selectedImage,
//           }
//         : undefined,
//       timestamp: new Date(),
//     };

//     setMessages((prev) => [...prev, userMessage]);
//     setInputText('');
//     setIsLoading(true);

//     try {
//       let response: string;

//       if (selectedImage) {
//         response = await sendImageMessage(messageText, selectedImage);
//       } else {
//         response = await sendTextMessage(messageText);
//       }

//       const assistantMessage: Message = {
//         ids: Date.now() + 1,
//         type: 'assistant',
//         content: response,
//         timestamp: new Date(),
//       };

//       setMessages((prev) => [...prev, assistantMessage]);
//       message.success('Message sent successfully');
//     } catch (error) {
//       console.error('Error sending message:', error);
//       const errorMessage: Message = {
//         ids: Date.now() + 1,
//         type: 'assistant',
//         content:
//           'Sorry, I encountered an error while processing your request. Please make sure the backend server is running and try again.',
//         timestamp: new Date(),
//       };
//       setMessages((prev) => [...prev, errorMessage]);
//       message.error('Failed to send message');
//     } finally {
//       setIsLoading(false);
//       removeSelectedImage();
//     }
//   };

//   const clearConversation = async () => {
//     try {
//       await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
//         method: 'DELETE',
//       });

//       setMessages([
//         {
//           ids: 2,
//           type: 'assistant',
//           content:
//             "Hello! I can help you with text questions and analyze images you upload. I'm powered by Hugging Face multimodal models. What would you like to know?",
//           timestamp: new Date(),
//         },
//       ]);
//       message.success('Conversation cleared');
//     } catch (error) {
//       console.error('Error clearing conversation:', error);
//       message.error('Failed to clear conversation');
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const formatTime = (date: Date) => {
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   const getStatusBadge = () => {
//     const statusConfig = {
//       connected: { status: 'success' as const, text: 'Connected' },
//       disconnected: { status: 'error' as const, text: 'Disconnected' },
//       checking: { status: 'processing' as const, text: 'Checking...' },
//     };

//     const config = statusConfig[connectionStatus.status];
//     return (
//       <Badge
//         status={config.status}
//         text={`${config.text}${selectedModel ? ` (${selectedModel})` : ''}`}
//       />
//     );
//   };

//   return (
//     <Content
//       style={{
//         padding: '24px',
//         overflowY: 'auto',
//         backgroundColor: '#f5f5f5',
//         height: 'calc(100vh - 64px)',
//         display: 'flex',
//         flexDirection: 'column',
//       }}
//     >
//       <Header
//         style={{
//           backgroundColor: '#fff',
//           borderBottom: '1px solid #f0f0f0',
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           padding: '0 24px',
//         }}
//       >
//         <div>
//           <Title level={3} style={{ margin: 0, color: '#1890ff', marginTop: 22 }}>
//             AI Chat Assistant
//           </Title>
//           <Text type='secondary'>Powered by Hugging Face Multimodal Models</Text>
//         </div>

//         <Space>
//           <Select
//             defaultValue='gemini-2.5-flash'
//             style={{ width: 180 }}
//             onChange={(value) => setSelectedModel(value)}
//             disabled={isLoading}
//           >
//             <Option value='gemini-2.5-flash'>Gemini-2.5 Flash</Option>
//             <Option value='llama4-maverick'>Llama 4</Option>
//             <Option value='gpt'>GPT</Option>
//             <Option value='openai-oss'>OpenAI OSS</Option>
//             <Option value='gemma-3-4b-it'>Gemma</Option>
//             <Option value='qwen2.5-VL'>Qwen2.5-VL</Option>
//             <Option value='mistral-7b'>Mistral</Option>
//           </Select>
//           {getStatusBadge()}
//           <Popconfirm
//             title='Clear conversation'
//             description='Are you sure you want to clear all messages?'
//             onConfirm={clearConversation}
//             okText='Yes'
//             cancelText='No'
//           >
//             <Button type='text' icon={<DeleteOutlined />} danger>
//               Clear
//             </Button>
//           </Popconfirm>
//         </Space>
//       </Header>
//       <div style={{ maxWidth: '800px', margin: '0 auto', flex: '1', overflowY: 'auto' }}>
//         <Space direction='vertical' size='middle' style={{ width: '100%' }}>
//           {messages.map((message) => (
//             <Card
//               key={message.ids}
//               style={{
//                 marginLeft: message.type === 'user' ? '20%' : '0',
//                 marginRight: message.type === 'assistant' ? '20%' : '0',
//               }}
//               styles={{ body: { padding: '12px 16px' } }}
//             >
//               <Space align='start'>
//                 <Avatar
//                   icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
//                   style={{
//                     backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a',
//                   }}
//                 />
//                 <div style={{ flex: 1 }}>
//                   {message.image && (
//                     <div style={{ marginBottom: '8px' }}>
//                       <img
//                         src={message.image.url}
//                         alt='Uploaded'
//                         style={{
//                           maxWidth: '200px',
//                           maxHeight: '200px',
//                           borderRadius: '8px',
//                           objectFit: 'cover',
//                         }}
//                       />
//                     </div>
//                   )}
//                   <Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
//                   <div style={{ marginTop: '4px' }}>
//                     <Text type='secondary' style={{ fontSize: '12px' }}>
//                       {formatTime(message.timestamp)}
//                     </Text>
//                   </div>
//                 </div>
//               </Space>
//             </Card>
//           ))}

//           {isLoading && (
//             <Card style={{ marginRight: '20%' }} styles={{ body: { padding: '12px 16px' } }}>
//               <Space align='start'>
//                 <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
//                 <Space>
//                   <Spin size='small' />
//                   <Text type='secondary'>Processing...</Text>
//                 </Space>
//               </Space>
//             </Card>
//           )}
//         </Space>
//         <div ref={messagesEndRef} />
//       </div>

//       {connectionStatus.status === 'disconnected' && (
//         <div
//           style={{
//             backgroundColor: '#fff2f0',
//             borderTop: '1px solid #ffccc7',
//             padding: '12px 24px',
//             textAlign: 'center',
//           }}
//         >
//           <Text type='danger'>
//             ⚠️ Cannot connect to backend server. Make sure the server is running on
//             http://localhost:5000
//           </Text>
//         </div>
//       )}

//       <Footer
//         style={{
//           backgroundColor: '#fff',
//           borderTop: '1px solid #f0f0f0',
//           padding: '16px 24px',
//         }}
//       >
//         <div style={{ maxWidth: '800px', margin: '0 auto' }}>
//           {imagePreview && (
//             <div style={{ marginBottom: '12px' }}>
//               <Card
//                 size='small'
//                 style={{ display: 'inline-block', position: 'relative' }}
//                 styles={{ body: { padding: '8px' } }}
//               >
//                 <img
//                   src={imagePreview}
//                   alt='Preview'
//                   style={{
//                     width: '60px',
//                     height: '60px',
//                     objectFit: 'cover',
//                     borderRadius: '4px',
//                   }}
//                 />
//                 <Button
//                   type='text'
//                   size='small'
//                   icon={<CloseOutlined />}
//                   onClick={removeSelectedImage}
//                   style={{
//                     position: 'absolute',
//                     top: '-8px',
//                     right: '-8px',
//                     backgroundColor: '#ff4d4f',
//                     color: 'white',
//                     borderRadius: '50%',
//                     width: '20px',
//                     height: '20px',
//                     minWidth: '20px',
//                     padding: 0,
//                   }}
//                 />
//               </Card>
//             </div>
//           )}

//           <Space.Compact style={{ width: '100%' }}>
//             <Upload
//               beforeUpload={handleImageSelect}
//               showUploadList={false}
//               accept='image/*'
//               disabled={isLoading || connectionStatus.status !== 'connected'}
//             >
//               <Button
//                 icon={<PictureOutlined />}
//                 disabled={isLoading || connectionStatus.status !== 'connected'}
//               >
//                 Image
//               </Button>
//             </Upload>

//             <TextArea
//               value={inputText}
//               onChange={(e) => setInputText(e.target.value)}
//               onKeyDown={handleKeyPress}
//               placeholder='Type your message... (Shift+Enter for new line)'
//               autoSize={{ minRows: 1, maxRows: 4 }}
//               disabled={isLoading || connectionStatus.status !== 'connected'}
//               style={{ flex: 1 }}
//             />

//             <Button
//               type='primary'
//               icon={<SendOutlined />}
//               onClick={sendMessage}
//               disabled={
//                 (!inputText.trim() && !selectedImage) ||
//                 isLoading ||
//                 connectionStatus.status !== 'connected'
//               }
//               loading={isLoading}
//             >
//               Send
//             </Button>
//           </Space.Compact>

//           <div style={{ marginTop: '8px', textAlign: 'center' }}>
//             <Text type='secondary' style={{ fontSize: '12px' }}>
//               Upload images for analysis or ask any question. Press Enter to send, Shift+Enter for
//               new line.
//             </Text>
//           </div>
//         </div>
//       </Footer>
//     </Content>
//   );
// };

// export default ImageChatBoxPage;

// ------------- Version 3 - that can generate multiple answer and user can select answer ---------------------------------

import React, { useState, useRef, useEffect } from 'react';
import {
  Layout,
  Input,
  Button,
  Upload,
  Card,
  Avatar,
  Typography,
  Space,
  Badge,
  Popconfirm,
  message,
  Spin,
  Divider,
  Col,
  Row,
  Select,
  Radio,
  Tooltip,
} from 'antd';
import {
  SendOutlined,
  PictureOutlined,
  UserOutlined,
  RobotOutlined,
  DeleteOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  StarOutlined,
  StarFilled,
} from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { TextArea } = Input;
const { Text, Title } = Typography;
const { Option } = Select;

interface ModelResponse {
  model: string;
  content: string;
  selected?: boolean;
}

interface Message {
  ids: number;
  type: 'user' | 'assistant' | 'multi-model';
  content: string;
  image?: {
    url: string;
    file: File;
  };
  timestamp: Date;
  modelResponses?: ModelResponse[];
  selectedResponse?: string;
}

interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'checking';
  model?: string;
}

const ImageChatBoxPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      ids: 2,
      type: 'assistant',
      content:
        "Hello! I can help you with text questions and analyze images you upload. I'm powered by multiple AI models. You can choose to get answers from a single model or compare responses from multiple models. What would you like to know?",
      timestamp: new Date(),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId] = useState('default');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'checking',
  });
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [useMultiModel, setUseMultiModel] = useState(false);

  // Define model groups for different types of queries
  const textModels = ['gemini-2.5-flash', 'openai-oss', 'gpt5'];
  const multimodalModels = ['gemini-2.5-pro', 'qwen2.5-VL', 'gemma-3-27b'];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_BASE_URL = 'http://localhost:5000/api';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus({
          status: 'connected',
          model: data.model || 'Unknown',
        });
      } else {
        setConnectionStatus({ status: 'disconnected' });
      }
    } catch (error) {
      setConnectionStatus({ status: 'disconnected' });
    }
  };

  const handleImageSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      return false; // Prevent default upload behavior
    }
    message.error('Please select a valid image file');
    return false;
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const sendTextMessage = async (message: string, model: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversation_id: conversationId,
          model: model,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error(`Error sending text message to ${model}:`, error);
      throw error;
    }
  };

  const sendImageMessage = async (message: string, imageFile: File, model: string) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('message', message);
      formData.append('conversation_id', conversationId);
      formData.append('model', model);

      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error(`Error sending image message to ${model}:`, error);
      throw error;
    }
  };

  const sendMultiModelMessage = async (messageText: string, imageFile?: File) => {
    const modelsToUse = imageFile ? multimodalModels : textModels;
    const responses: ModelResponse[] = [];

    // Send requests to all models concurrently
    const promises = modelsToUse.map(async (model) => {
      try {
        let response: string;
        if (imageFile) {
          response = await sendImageMessage(messageText, imageFile, model);
        } else {
          response = await sendTextMessage(messageText, model);
        }
        return { model, content: response };
      } catch (error) {
        console.error(`Error with model ${model}:`, error);
        return {
          model,
          content: `Error: Failed to get response from ${model}. Please try again.`,
        };
      }
    });

    const results = await Promise.all(promises);
    return results;
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) {
      message.warning('Please enter a message or select an image');
      return;
    }

    if (connectionStatus.status !== 'connected') {
      message.error('Backend server is not connected. Please check if the server is running.');
      return;
    }

    const messageText = inputText || 'Please analyze this image.';
    const userMessage: Message = {
      ids: Date.now(),
      type: 'user',
      content: messageText,
      image: selectedImage
        ? {
            url: imagePreview!,
            file: selectedImage,
          }
        : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      if (useMultiModel) {
        // Multi-model mode
        const modelResponses = await sendMultiModelMessage(messageText, selectedImage || undefined);

        const multiModelMessage: Message = {
          ids: Date.now() + 1,
          type: 'multi-model',
          content: 'Multiple AI models have generated responses. Please select the best answer:',
          timestamp: new Date(),
          modelResponses: modelResponses,
        };

        setMessages((prev) => [...prev, multiModelMessage]);
      } else {
        // Single model mode
        let response: string;

        if (selectedImage) {
          response = await sendImageMessage(messageText, selectedImage, selectedModel);
        } else {
          response = await sendTextMessage(messageText, selectedModel);
        }

        const assistantMessage: Message = {
          ids: Date.now() + 1,
          type: 'assistant',
          content: response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }

      message.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        ids: Date.now() + 1,
        type: 'assistant',
        content:
          'Sorry, I encountered an error while processing your request. Please make sure the backend server is running and try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      message.error('Failed to send message');
    } finally {
      setIsLoading(false);
      removeSelectedImage();
    }
  };

  const selectModelResponse = (
    messageId: number,
    selectedModel: string,
    selectedContent: string,
  ) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.ids === messageId) {
          return {
            ...msg,
            selectedResponse: selectedModel,
            modelResponses: msg.modelResponses?.map((resp) => ({
              ...resp,
              selected: resp.model === selectedModel,
            })),
          };
        }
        return msg;
      }),
    );

    // Add the selected response as a new assistant message
    const assistantMessage: Message = {
      ids: Date.now(),
      type: 'assistant',
      content: selectedContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    message.success(`Selected response from ${selectedModel}`);
  };

  const clearConversation = async () => {
    try {
      await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
        method: 'DELETE',
      });

      setMessages([
        {
          ids: 2,
          type: 'assistant',
          content:
            "Hello! I can help you with text questions and analyze images you upload. I'm powered by multiple AI models. You can choose to get answers from a single model or compare responses from multiple models. What would you like to know?",
          timestamp: new Date(),
        },
      ]);
      message.success('Conversation cleared');
    } catch (error) {
      console.error('Error clearing conversation:', error);
      message.error('Failed to clear conversation');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = () => {
    const statusConfig = {
      connected: { status: 'success' as const, text: 'Connected' },
      disconnected: { status: 'error' as const, text: 'Disconnected' },
      checking: { status: 'processing' as const, text: 'Checking...' },
    };

    const config = statusConfig[connectionStatus.status];
    return (
      <Badge
        status={config.status}
        text={`${config.text}${useMultiModel ? ' (Multi-Model)' : ` (${selectedModel})`}`}
      />
    );
  };

  const renderMessage = (message: Message) => {
    if (message.type === 'multi-model') {
      return (
        <Card
          key={message.ids}
          style={{ marginRight: '10%' }}
          styles={{ body: { padding: '12px 16px' } }}
        >
          <Space align='start' style={{ width: '100%' }}>
            <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#722ed1' }} />
            <div style={{ flex: 1, width: '100%' }}>
              <Text style={{ whiteSpace: 'pre-wrap', fontWeight: 'bold' }}>{message.content}</Text>
              <div style={{ marginTop: '12px' }}>
                <Row gutter={[16, 16]}>
                  {message.modelResponses?.map((response, index) => (
                    <Col xs={24} md={8} key={response.model}>
                      <Card
                        size='small'
                        title={
                          <Space>
                            <Text strong>{response.model}</Text>
                            {response.selected && (
                              <CheckCircleOutlined style={{ color: '#52c41a' }} />
                            )}
                          </Space>
                        }
                        extra={
                          !message.selectedResponse && (
                            <Tooltip title='Select this response'>
                              <Button
                                type='primary'
                                size='small'
                                icon={<StarOutlined />}
                                onClick={() =>
                                  selectModelResponse(message.ids, response.model, response.content)
                                }
                              >
                                Select
                              </Button>
                            </Tooltip>
                          )
                        }
                        style={{
                          border: response.selected ? '2px solid #52c41a' : undefined,
                          opacity: message.selectedResponse && !response.selected ? 0.6 : 1,
                        }}
                      >
                        <Text style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                          {response.content.length > 200
                            ? `${response.content.substring(0, 1000)}...`
                            : response.content}
                          {/* {response.content} */}
                        </Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
              <div style={{ marginTop: '8px' }}>
                <Text type='secondary' style={{ fontSize: '12px' }}>
                  {formatTime(message.timestamp)}
                </Text>
              </div>
            </div>
          </Space>
        </Card>
      );
    }

    // Regular message rendering
    return (
      <Card
        key={message.ids}
        style={{
          marginLeft: message.type === 'user' ? '20%' : '0',
          marginRight: message.type === 'assistant' ? '20%' : '0',
        }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Space align='start'>
          <Avatar
            icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
            style={{
              backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a',
            }}
          />
          <div style={{ flex: 1 }}>
            {message.image && (
              <div style={{ marginBottom: '8px' }}>
                <img
                  src={message.image.url}
                  alt='Uploaded'
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
            <Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
            <div style={{ marginTop: '4px' }}>
              <Text type='secondary' style={{ fontSize: '12px' }}>
                {formatTime(message.timestamp)}
              </Text>
            </div>
          </div>
        </Space>
      </Card>
    );
  };

  return (
    <Content
      style={{
        padding: '24px',
        overflowY: 'auto',
        backgroundColor: '#f5f5f5',
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 24px',
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: '#1890ff', marginTop: 22 }}>
            AI Chat Assistant
          </Title>
          <Text type='secondary'>Powered by Multiple AI Models</Text>
        </div>

        <Space>
          <Radio.Group
            value={useMultiModel}
            onChange={(e) => setUseMultiModel(e.target.value)}
            buttonStyle='solid'
            disabled={isLoading}
          >
            <Radio.Button value={false}>Single Model</Radio.Button>
            <Radio.Button value={true}>Multi-Model</Radio.Button>
          </Radio.Group>

          {!useMultiModel && (
            <Select
              value={selectedModel}
              style={{ width: 180 }}
              onChange={(value) => setSelectedModel(value)}
              disabled={isLoading}
            >
              <Option value='gemini-2.5-flash'>Gemini-2.5 Flash(LLM)</Option>
              <Option value='gpt5'>GPT-5(LLM)</Option>
              <Option value='openai-oss'>OpenAI OSS(LLM)</Option>
              <Option value='gemma-3-4b-local'>gemma-3-4b-local(Multimodal)</Option>
              <Option value='gemma-3-27b'>Gemma(Multimodal)</Option>
              <Option value='qwen2.5-VL'>Qwen2.5-VL(Multimodal)</Option>
            </Select>
          )}

          {getStatusBadge()}
          <Popconfirm
            title='Clear conversation'
            description='Are you sure you want to clear all messages?'
            onConfirm={clearConversation}
            okText='Yes'
            cancelText='No'
          >
            <Button type='text' icon={<DeleteOutlined />} danger>
              Clear
            </Button>
          </Popconfirm>
        </Space>
      </Header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', flex: '1', overflowY: 'auto' }}>
        <Space direction='vertical' size='middle' style={{ width: '100%' }}>
          {messages.map((message) => renderMessage(message))}

          {isLoading && (
            <Card style={{ marginRight: '20%' }} styles={{ body: { padding: '12px 16px' } }}>
              <Space align='start'>
                <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
                <Space>
                  <Spin size='small' />
                  <Text type='secondary'>
                    {useMultiModel ? 'Getting responses from multiple models...' : 'Processing...'}
                  </Text>
                </Space>
              </Space>
            </Card>
          )}
        </Space>
        <div ref={messagesEndRef} />
      </div>

      {connectionStatus.status === 'disconnected' && (
        <div
          style={{
            backgroundColor: '#fff2f0',
            borderTop: '1px solid #ffccc7',
            padding: '12px 24px',
            textAlign: 'center',
          }}
        >
          <Text type='danger'>
            ⚠️ Cannot connect to backend server. Make sure the server is running on
            http://localhost:5000
          </Text>
        </div>
      )}

      <Footer
        style={{
          backgroundColor: '#fff',
          borderTop: '1px solid #f0f0f0',
          padding: '16px 24px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {imagePreview && (
            <div style={{ marginBottom: '12px' }}>
              <Card
                size='small'
                style={{ display: 'inline-block', position: 'relative' }}
                styles={{ body: { padding: '8px' } }}
              >
                <img
                  src={imagePreview}
                  alt='Preview'
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                />
                <Button
                  type='text'
                  size='small'
                  icon={<CloseOutlined />}
                  onClick={removeSelectedImage}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#ff4d4f',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    minWidth: '20px',
                    padding: 0,
                  }}
                />
              </Card>
            </div>
          )}

          <Space.Compact style={{ width: '100%' }}>
            <Upload
              beforeUpload={handleImageSelect}
              showUploadList={false}
              accept='image/*'
              disabled={isLoading || connectionStatus.status !== 'connected'}
            >
              <Button
                icon={<PictureOutlined />}
                disabled={isLoading || connectionStatus.status !== 'connected'}
              >
                Image
              </Button>
            </Upload>

            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                useMultiModel
                  ? 'Ask a question to get responses from multiple AI models...'
                  : 'Type your message... (Shift+Enter for new line)'
              }
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={isLoading || connectionStatus.status !== 'connected'}
              style={{ flex: 1 }}
            />

            <Button
              type='primary'
              icon={<SendOutlined />}
              onClick={sendMessage}
              disabled={
                (!inputText.trim() && !selectedImage) ||
                isLoading ||
                connectionStatus.status !== 'connected'
              }
              loading={isLoading}
            >
              Send
            </Button>
          </Space.Compact>

          <div style={{ marginTop: '8px', textAlign: 'center' }}>
            <Text type='secondary' style={{ fontSize: '12px' }}>
              {useMultiModel
                ? 'Multi-model mode: Get responses from 3 different AI models and select the best one.'
                : 'Single model mode: Get response from one selected model.'}{' '}
              Press Enter to send, Shift+Enter for new line.
            </Text>
          </div>
        </div>
      </Footer>
    </Content>
  );
};

export default ImageChatBoxPage;

// ----------------------------- version 4 ---------------

// import React, { useState, useRef, useEffect } from 'react';
// import {
//   Layout,
//   Input,
//   Button,
//   Upload,
//   Card,
//   Avatar,
//   Typography,
//   Space,
//   Badge,
//   Popconfirm,
//   message,
//   Spin,
//   Select,
// } from 'antd';
// import {
//   SendOutlined,
//   PictureOutlined,
//   UserOutlined,
//   RobotOutlined,
//   DeleteOutlined,
//   CloseOutlined,
// } from '@ant-design/icons';

// const { Header, Content, Footer } = Layout;
// const { TextArea } = Input;
// const { Text, Title } = Typography;
// const { Option } = Select;

// interface CandidateResponse {
//   model: string;
//   answer: string;
// }

// interface Message {
//   ids: number;
//   type: 'user' | 'assistant' | 'candidates';
//   content: string;
//   image?: {
//     url: string;
//     file: File;
//   };
//   timestamp: Date;
//   candidates?: CandidateResponse[];
// }

// interface ConnectionStatus {
//   status: 'connected' | 'disconnected' | 'checking';
//   model?: string;
// }

// const ImageChatBoxPage: React.FC = () => {
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       ids: 2,
//       type: 'assistant',
//       content:
//         "Hello! I can help you with text questions and analyze images you upload. I'm powered by Hugging Face multimodal models. What would you like to know?",
//       timestamp: new Date(),
//     },
//   ]);

//   const [inputText, setInputText] = useState('');
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [conversationId] = useState('default');
//   const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
//     status: 'checking',
//   });
//   const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');

//   const messagesEndRef = useRef<HTMLDivElement>(null);
//   const API_BASE_URL = 'http://localhost:5000/api';

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   useEffect(() => {
//     checkBackendConnection();
//   }, []);

//   const checkBackendConnection = async () => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/health`);
//       if (response.ok) {
//         const data = await response.json();
//         setConnectionStatus({
//           status: 'connected',
//           model: data.model || 'Unknown',
//         });
//       } else {
//         setConnectionStatus({ status: 'disconnected' });
//       }
//     } catch (error) {
//       setConnectionStatus({ status: 'disconnected' });
//     }
//   };

//   const handleImageSelect = (file: File) => {
//     if (file && file.type.startsWith('image/')) {
//       setSelectedImage(file);
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         if (e.target?.result) {
//           setImagePreview(e.target.result as string);
//         }
//       };
//       reader.readAsDataURL(file);
//       return false; // Prevent default upload behavior
//     }
//     message.error('Please select a valid image file');
//     return false;
//   };

//   const removeSelectedImage = () => {
//     setSelectedImage(null);
//     setImagePreview(null);
//   };

//   const sendTextMessage = async (message: string) => {
//     const response = await fetch(`${API_BASE_URL}/chat`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         message,
//         conversation_id: conversationId,
//         model: selectedModel,
//       }),
//     });
//     if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//     const data = await response.json();
//     return data.responses; // array of candidate answers
//   };

//   const sendImageMessage = async (message: string, imageFile: File) => {
//     const formData = new FormData();
//     formData.append('image', imageFile);
//     formData.append('message', message);
//     formData.append('conversation_id', conversationId);
//     formData.append('model', selectedModel);

//     const response = await fetch(`${API_BASE_URL}/chat/image`, {
//       method: 'POST',
//       body: formData,
//     });
//     if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
//     const data = await response.json();
//     return data.responses; // array of candidate answers
//   };

//   const sendMessage = async () => {
//     if (!inputText.trim() && !selectedImage) {
//       message.warning('Please enter a message or select an image');
//       return;
//     }

//     if (connectionStatus.status !== 'connected') {
//       message.error('Backend server is not connected.');
//       return;
//     }

//     const messageText = inputText || 'Please analyze this image.';
//     const userMessage: Message = {
//       ids: Date.now(),
//       type: 'user',
//       content: messageText,
//       image: selectedImage ? { url: imagePreview!, file: selectedImage } : undefined,
//       timestamp: new Date(),
//     };

//     setMessages((prev) => [...prev, userMessage]);
//     setInputText('');
//     setIsLoading(true);

//     try {
//       let responses: CandidateResponse[];
//       if (selectedImage) {
//         responses = await sendImageMessage(messageText, selectedImage);
//       } else {
//         responses = await sendTextMessage(messageText);
//       }

//       const candidateMessage: Message = {
//         ids: Date.now() + 1,
//         type: 'candidates',
//         content: 'Multiple responses available',
//         timestamp: new Date(),
//         candidates: responses,
//       };

//       setMessages((prev) => [...prev, candidateMessage]);
//     } catch (error) {
//       console.error('Error sending message:', error);
//       setMessages((prev) => [
//         ...prev,
//         {
//           ids: Date.now() + 1,
//           type: 'assistant',
//           content: 'Sorry, error occurred while processing your request.',
//           timestamp: new Date(),
//         },
//       ]);
//     } finally {
//       setIsLoading(false);
//       removeSelectedImage();
//     }
//   };

//   const clearConversation = async () => {
//     try {
//       await fetch(`${API_BASE_URL}/conversation/${conversationId}`, {
//         method: 'DELETE',
//       });

//       setMessages([
//         {
//           ids: 2,
//           type: 'assistant',
//           content:
//             "Hello! I can help you with text questions and analyze images you upload. I'm powered by Hugging Face multimodal models. What would you like to know?",
//           timestamp: new Date(),
//         },
//       ]);
//       message.success('Conversation cleared');
//     } catch (error) {
//       console.error('Error clearing conversation:', error);
//       message.error('Failed to clear conversation');
//     }
//   };

//   const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const formatTime = (date: Date) =>
//     date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

//   const getStatusBadge = () => {
//     const statusConfig = {
//       connected: { status: 'success' as const, text: 'Connected' },
//       disconnected: { status: 'error' as const, text: 'Disconnected' },
//       checking: { status: 'processing' as const, text: 'Checking...' },
//     };

//     const config = statusConfig[connectionStatus.status];
//     return (
//       <Badge
//         status={config.status}
//         text={`${config.text}${selectedModel ? ` (${selectedModel})` : ''}`}
//       />
//     );
//   };

//   return (
//     <Content
//       style={{
//         padding: '24px',
//         overflowY: 'auto',
//         backgroundColor: '#f5f5f5',
//         height: 'calc(100vh - 64px)',
//         display: 'flex',
//         flexDirection: 'column',
//       }}
//     >
//       <Header
//         style={{
//           backgroundColor: '#fff',
//           borderBottom: '1px solid #f0f0f0',
//           display: 'flex',
//           justifyContent: 'space-between',
//           alignItems: 'center',
//           padding: '0 24px',
//         }}
//       >
//         <div>
//           <Title level={3} style={{ margin: 0, color: '#1890ff', marginTop: 22 }}>
//             AI Chat Assistant
//           </Title>
//           <Text type='secondary'>Powered by Hugging Face Multimodal Models</Text>
//         </div>

//         <Space>
//           <Select
//             defaultValue='gemini-2.5-flash'
//             style={{ width: 180 }}
//             onChange={(value) => setSelectedModel(value)}
//             disabled={isLoading}
//           >
//             <Option value='gemini-2.5-flash'>Gemini-2.5 Flash</Option>
//             <Option value='llama4-maverick'>Llama 4</Option>
//             <Option value='gpt'>GPT</Option>
//             <Option value='openai-oss'>OpenAI OSS</Option>
//             <Option value='gemma-3-4b-it'>Gemma</Option>
//             <Option value='qwen2.5-VL'>Qwen2.5-VL</Option>
//             <Option value='mistral-7b'>Mistral</Option>
//           </Select>
//           {getStatusBadge()}
//           <Popconfirm
//             title='Clear conversation'
//             description='Are you sure you want to clear all messages?'
//             onConfirm={clearConversation}
//             okText='Yes'
//             cancelText='No'
//           >
//             <Button type='text' icon={<DeleteOutlined />} danger>
//               Clear
//             </Button>
//           </Popconfirm>
//         </Space>
//       </Header>

//       <div style={{ maxWidth: '800px', margin: '0 auto', flex: 1, overflowY: 'auto' }}>
//         <Space direction='vertical' size='middle' style={{ width: '100%' }}>
//           {messages.map((message) => {
//             if (message.type === 'candidates' && message.candidates) {
//               return (
//                 <Card key={message.ids} style={{ marginRight: '20%' }}>
//                   <Text strong>Choose the best answer:</Text>
//                   <Space direction='vertical' style={{ width: '100%', marginTop: 8 }}>
//                     {message.candidates.map((c, idx) => (
//                       <Card size='small' key={idx} style={{ borderLeft: '4px solid #1890ff' }}>
//                         <Text type='secondary'>{c.model}</Text>
//                         <div style={{ margin: '8px 0' }}>{c.answer}</div>
//                         <Button
//                           type='primary'
//                           size='small'
//                           onClick={() => {
//                             const chosen: Message = {
//                               ids: Date.now(),
//                               type: 'assistant',
//                               content: c.answer,
//                               timestamp: new Date(),
//                             };
//                             setMessages((prev) =>
//                               prev.filter((m) => m.ids !== message.ids).concat(chosen),
//                             );
//                           }}
//                         >
//                           Select this answer
//                         </Button>
//                       </Card>
//                     ))}
//                   </Space>
//                 </Card>
//               );
//             }

//             return (
//               <Card
//                 key={message.ids}
//                 style={{
//                   marginLeft: message.type === 'user' ? '20%' : '0',
//                   marginRight: message.type === 'assistant' ? '20%' : '0',
//                 }}
//                 styles={{ body: { padding: '12px 16px' } }}
//               >
//                 <Space align='start'>
//                   <Avatar
//                     icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
//                     style={{
//                       backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a',
//                     }}
//                   />
//                   <div style={{ flex: 1 }}>
//                     {message.image && (
//                       <div style={{ marginBottom: '8px' }}>
//                         <img
//                           src={message.image.url}
//                           alt='Uploaded'
//                           style={{
//                             maxWidth: '200px',
//                             maxHeight: '200px',
//                             borderRadius: '8px',
//                             objectFit: 'cover',
//                           }}
//                         />
//                       </div>
//                     )}
//                     <Text style={{ whiteSpace: 'pre-wrap' }}>{message.content}</Text>
//                     <div style={{ marginTop: '4px' }}>
//                       <Text type='secondary' style={{ fontSize: '12px' }}>
//                         {formatTime(message.timestamp)}
//                       </Text>
//                     </div>
//                   </div>
//                 </Space>
//               </Card>
//             );
//           })}

//           {isLoading && (
//             <Card style={{ marginRight: '20%' }} styles={{ body: { padding: '12px 16px' } }}>
//               <Space align='start'>
//                 <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#52c41a' }} />
//                 <Space>
//                   <Spin size='small' />
//                   <Text type='secondary'>Processing...</Text>
//                 </Space>
//               </Space>
//             </Card>
//           )}
//         </Space>
//         <div ref={messagesEndRef} />
//       </div>

//       {connectionStatus.status === 'disconnected' && (
//         <div
//           style={{
//             backgroundColor: '#fff2f0',
//             borderTop: '1px solid #ffccc7',
//             padding: '12px 24px',
//             textAlign: 'center',
//           }}
//         >
//           <Text type='danger'>
//             ⚠️ Cannot connect to backend server. Make sure the server is running on
//             http://localhost:5000
//           </Text>
//         </div>
//       )}

//       <Footer
//         style={{
//           backgroundColor: '#fff',
//           borderTop: '1px solid #f0f0f0',
//           padding: '16px 24px',
//         }}
//       >
//         <div style={{ maxWidth: '800px', margin: '0 auto' }}>
//           {imagePreview && (
//             <div style={{ marginBottom: '12px' }}>
//               <Card
//                 size='small'
//                 style={{ display: 'inline-block', position: 'relative' }}
//                 styles={{ body: { padding: '8px' } }}
//               >
//                 <img
//                   src={imagePreview}
//                   alt='Preview'
//                   style={{
//                     width: '60px',
//                     height: '60px',
//                     objectFit: 'cover',
//                     borderRadius: '4px',
//                   }}
//                 />
//                 <Button
//                   type='text'
//                   size='small'
//                   icon={<CloseOutlined />}
//                   onClick={removeSelectedImage}
//                   style={{
//                     position: 'absolute',
//                     top: '-8px',
//                     right: '-8px',
//                     backgroundColor: '#ff4d4f',
//                     color: 'white',
//                     borderRadius: '50%',
//                     width: '20px',
//                     height: '20px',
//                     minWidth: '20px',
//                     padding: 0,
//                   }}
//                 />
//               </Card>
//             </div>
//           )}

//           <Space.Compact style={{ width: '100%' }}>
//             <Upload
//               beforeUpload={handleImageSelect}
//               showUploadList={false}
//               accept='image/*'
//               disabled={isLoading || connectionStatus.status !== 'connected'}
//             >
//               <Button
//                 icon={<PictureOutlined />}
//                 disabled={isLoading || connectionStatus.status !== 'connected'}
//               >
//                 Image
//               </Button>
//             </Upload>

//             <TextArea
//               value={inputText}
//               onChange={(e) => setInputText(e.target.value)}
//               onKeyDown={handleKeyPress}
//               placeholder='Type your message... (Shift+Enter for new line)'
//               autoSize={{ minRows: 1, maxRows: 4 }}
//               disabled={isLoading || connectionStatus.status !== 'connected'}
//               style={{ flex: 1 }}
//             />

//             <Button
//               type='primary'
//               icon={<SendOutlined />}
//               onClick={sendMessage}
//               disabled={
//                 (!inputText.trim() && !selectedImage) ||
//                 isLoading ||
//                 connectionStatus.status !== 'connected'
//               }
//               loading={isLoading}
//             >
//               Send
//             </Button>
//           </Space.Compact>

//           <div style={{ marginTop: '8px', textAlign: 'center' }}>
//             <Text type='secondary' style={{ fontSize: '12px' }}>
//               Upload images for analysis or ask any question. Press Enter to send, Shift+Enter for
//               new line.
//             </Text>
//           </div>
//         </div>
//       </Footer>
//     </Content>
//   );
// };

// export default ImageChatBoxPage;
