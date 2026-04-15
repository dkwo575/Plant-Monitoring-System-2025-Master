// import React, { useState, FormEvent } from 'react';

// // Define the structure of a message object
// interface Message {
//   text: string;
//   sender: 'user' | 'bot';
// }

// const ChatBoxTest: React.FC = () => {
//   // State to hold the chat messages
//   const [messages, setMessages] = useState<Message[]>([]);
//   // State for the user's input
//   const [input, setInput] = useState<string>('');
//   // State to track loading status
//   const [isLoading, setIsLoading] = useState<boolean>(false);

//   // Handle form submission
//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!input.trim()) return;

//     // Add user's message to the chat
//     const userMessage: Message = { text: input, sender: 'user' };
//     setMessages((prevMessages) => [...prevMessages, userMessage]);
//     setInput('');
//     setIsLoading(true);

//     try {
//       // Send the message to the Flask backend
//       const response = await fetch('http://localhost/api/chat_test', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ message: input }),
//       });

//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }

//       const data = await response.json();

//       // Add the bot's response to the chat
//       const botMessage: Message = { text: data.response, sender: 'bot' };
//       setMessages((prevMessages) => [...prevMessages, botMessage]);
//     } catch (error) {
//       console.error('Error fetching data:', error);
//       const errorMessage: Message = {
//         text: 'Sorry, something went wrong.',
//         sender: 'bot',
//       };
//       setMessages((prevMessages) => [...prevMessages, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div
//       style={{
//         fontFamily: 'Arial, sans-serif',
//         maxWidth: '600px',
//         margin: '0 auto',
//         padding: '20px',
//       }}
//     >
//       <div style={{ border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
//         <div
//           style={{
//             height: '400px',
//             overflowY: 'auto',
//             padding: '10px',
//             display: 'flex',
//             flexDirection: 'column',
//             gap: '10px',
//           }}
//         >
//           {messages.map((msg, index) => (
//             <div
//               key={index}
//               style={{
//                 alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
//                 background: msg.sender === 'user' ? '#dcf8c6' : '#f1f0f0',
//                 padding: '8px 12px',
//                 borderRadius: '12px',
//                 maxWidth: '70%',
//               }}
//             >
//               {msg.text}
//             </div>
//           ))}
//           {isLoading && (
//             <div style={{ alignSelf: 'flex-start', color: '#888' }}>Bot is typing...</div>
//           )}
//         </div>
//         <form
//           onSubmit={handleSubmit}
//           style={{ display: 'flex', padding: '10px', borderTop: '1px solid #ccc' }}
//         >
//           <input
//             type='text'
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             style={{
//               flex: 1,
//               padding: '10px',
//               borderRadius: '20px',
//               border: '1px solid #ccc',
//               marginRight: '10px',
//             }}
//             placeholder='Type your message...'
//           />
//           <button
//             type='submit'
//             style={{
//               padding: '10px 20px',
//               borderRadius: '20px',
//               border: 'none',
//               background: '#4CAF50',
//               color: 'white',
//               cursor: 'pointer',
//             }}
//           >
//             Send
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ChatBoxTest;

// -------------------- versino 2 ---------------

import React, { useState } from 'react';
import { Input, Button, List, Typography, Layout } from 'antd';
import axios from 'axios';

const { Header, Content } = Layout;
const { Text } = Typography;

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/chat_test', {
        message: input,
      });
      setMessages([...newMessages, { sender: 'bot', text: res.data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { sender: 'bot', text: 'Error: Could not reach server.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ color: '#fff', fontSize: '1.5em' }}>Chatbot Test</Header>
      <Content style={{ padding: '20px' }}>
        <List
          bordered
          dataSource={messages}
          renderItem={(msg) => (
            <List.Item style={{ background: msg.sender === 'user' ? '#e6f7ff' : '#fff' }}>
              <Text strong>{msg.sender === 'user' ? 'You: ' : 'Bot: '}</Text>
              {msg.text}
            </List.Item>
          )}
          style={{ marginBottom: '10px', height: '70vh', overflowY: 'auto' }}
        />
        <Input.Group compact>
          <Input
            style={{ width: 'calc(100% - 100px)' }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={sendMessage}
            placeholder='Type your message...'
          />
          <Button type='primary' onClick={sendMessage} loading={loading}>
            Send
          </Button>
        </Input.Group>
      </Content>
    </Layout>
  );
};

export default App;
