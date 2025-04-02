import React, { useState } from 'react';
import axios from 'axios';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import { Card, Col, Row, Typography } from 'antd';
import { MaterialSymbol } from 'react-material-symbols';
import theme from '../theme';

import config from '../chatbot/configchatbot';
import MessageParser from '../chatbot/MessageParser';
import ActionProvider from '../chatbot/ActionProvider';

const ChatbotComponent: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleChatbot = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div>
      {/* chatbot toggle button */}
      <button
        onClick={toggleChatbot}
        // <MaterialSymbol icon='chat' size={24} grade={-25} color={theme.palette.primary6} />

        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
        }}
      >
        {isOpen ? '✖' : '💬'}
      </button>

      {/* chatbot component */}

      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '400px',
          height: '600px',
          borderRadius: '10px',
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
          backgroundColor: 'white',
          padding: '10px',
          transition: 'opacity 0.3s ease-in-out, visibility 0.3s ease-in-out',
          opacity: isOpen ? 1 : 0, // Smooth fade effect
          visibility: isOpen ? 'visible' : 'hidden', // Completely hides when closed
          overflow: 'hidden', // Ensures content stays within the container
        }}
      >
        <Chatbot config={config} messageParser={MessageParser} actionProvider={ActionProvider} />
      </div>

      <div>
        {/* {isOpen && (
          <Chatbot config={config} messageParser={MessageParser} actionProvider={ActionProvider} />
        )} */}
      </div>
    </div>
  );
};

export default ChatbotComponent;

// import React, { useState } from 'react';
// import axios from 'axios';
// import Chatbot from 'react-chatbot-kit';
// import 'react-chatbot-kit/build/main.css';
// import { Card, Col, Row, Typography } from 'antd';
// import { MaterialSymbol } from 'react-material-symbols';
// import theme from '../theme';
// import { init } from 'mixpanel-browser';

// // new react chatbot

// // Configuration of chatbot
// const config = {
//   botName: 'Smart Farm Bot',
//   initialMessages: [
//     {
//       type: 'text',
//       message: "Hello! I'm the Smart Farm Bot. How can I help you today?",
//     },
//   ],
//   customStyles: {
//     botMessageBox: {
//       backgroundColor: '#376B7E',
//     },
//     chatButton: {
//       backgroundColor: '#376B7E',
//     },
//   },
// };

// // chatbot messageParser
// class MessageParser {
//   actionProvider: any;
//   state: any;

//   constructor(actionProvider: any, state: any) {
//     this.actionProvider = actionProvider;
//     this.state = state;
//   }

//   parse(message) {
//     // Check if the message contains a date and an environmental value type
//     const dateRegex = /\d{2}\/\d{2}\/\d{2}/;
//     const valueTypes = ['temperature', 'humidity', 'light', 'waterlevel', 'soilhumidity', 'steam'];

//     if (
//       dateRegex.test(message) &&
//       valueTypes.some((type) => message.toLowerCase().includes(type))
//     ) {
//       this.actionProvider.handleEnvironmentQuery(message);
//     } else {
//       this.actionProvider.handleGenericMessage();
//     }
//   }
// }

// // chatbot actionProvider

// // ActionProvider to manage bot responses
// class ActionProvider {
//   createChatBotMessage;
//   setState;
//   createClientMessage;

//   constructor(createChatBotMessage: any, setStateFunc: any, createClientMessage: any) {
//     this.createChatBotMessage = createChatBotMessage;
//     this.setState = setStateFunc;
//     this.createClientMessage = createClientMessage;
//   }

//   async handleEnvironmentQuery(message) {
//     try {
//       // Send query to backend
//       const response = await axios.post('http://localhost:5000/query_environment', {
//         query: message,
//       });

//       if (response.data.error) {
//         this.addMessageToBotState(response.data.error);
//       } else {
//         // Format the response
//         const responseMessage =
//           response.data.response ||
//           `The value is ${response.data.value} recorded at ${response.data.timestamp}`;

//         this.addMessageToBotState(responseMessage);
//       }
//     } catch (error) {
//       this.addMessageToBotState("Sorry, I couldn't retrieve the information.");
//     }
//   }

//   handleGenericMessage() {
//     const message = this.createChatBotMessage(
//       "I can help you with environmental data. Please ask about a specific value type and date, like 'What is the temperature on 24/03/25?'",
//     );
//     this.addMessageToBotState(message);
//   }

//   addMessageToBotState(message) {
//     this.setState((prev) => ({
//       ...prev,
//       messages: [
//         ...prev.messages,
//         typeof message === 'string' ? this.createChatBotMessage(message) : message,
//       ],
//     }));
//   }
// }

// // Floating Chatbot Component
// const FloatingChatbot = () => {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div className='fixed bottom-4 right-4 z-50'>
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className='bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600'
//       >
//         {isOpen ? '✖' : '💬'}
//       </button>

//       {isOpen && (
//         <div className='mt-4'>
//           <Chatbot config={config} messageParser={MessageParser} actionProvider={ActionProvider} />
//         </div>
//       )}
//     </div>
//   );
// };

// export default FloatingChatbot;
