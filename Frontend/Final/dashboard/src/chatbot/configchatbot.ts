// import { createChatBotMessage } from 'react-chatbot-kit';

// const botName = 'PlantBot';

// const config = {
//   botName: botName,
//   initialMessages: [createChatBotMessage(`Hi! I'm ${botName}. Ask me about your plants.`)],
//   customStyles: {
//     botMessageBox: {
//       backgroundColor: '#376B7E',
//     },
//     chatButton: {
//       backgroundColor: '#5ccc9d',
//     },
//   },
//   state: { VoiceEnabled: true }, // Add this property to avoid the error
//   widgets: [],
//   customComponents: {}, // Add this property to avoid the error

//   // customComponents: {}, // Add this property to avoid the error
// };

// export default config;

// 2nd version
// src/chatbot/configchatbot.ts
// import { createChatBotMessage } from 'react-chatbot-kit';
// import ChatbotNavigateButton from '../components/ChatbotNavigateButton';
// import React from 'react';
// import ChatbotInlineChart from './ChatbotInlineChart';

// const botName = 'PlantBot';

// const config = {
//   botName,
//   initialMessages: [createChatBotMessage(`Hi! I'm ${botName}. Ask me about your plants.`)],
//   customStyles: {
//     botMessageBox: { backgroundColor: '#376B7E' },
//     chatButton: { backgroundColor: '#5ccc9d' },
//   },
//   state: { voiceEnabled: true },
//   widgets: [
//     {
//       widgetName: 'navigateButton',
//       widgetFunc: (props: any) => React.createElement(ChatbotNavigateButton, props),
//       mapStateToProps: [],
//     },
//     {
//       widgetName: 'inlineMetricChart',
//       widgetFunc: (widgetProps: any) =>
//         React.createElement(ChatbotInlineChart, {
//           metric: widgetProps.payload?.metric,
//           days: widgetProps.payload?.days,
//         }),
//       props: {},
//     },
//   ],
//   customComponents: {},
// };

// export default config;

// 3rd version
// src/chatbot/configchatbot.ts
// src/chatbot/configchatbot.ts
import { createChatBotMessage } from 'react-chatbot-kit';
import ActionProvider from './ActionProvider';
import MessageParser from './MessageParser';

const botName = 'PlantBot';

const config = {
  botName,
  initialMessages: [createChatBotMessage(`Hi! I'm ${botName}. Ask me about your plants.`)],
  customComponents: {
    // header: () => <div className="...">PlantBot</div>
  },
  state: {
    // 全局状态
  },
  customStyles: {
    // 根据主题
    botMessageBox: { backgroundColor: '#eaf3f7' },
    chatButton: { backgroundColor: '#4caf50' },
  },
  // ActionProvider / MessageParser 绑定进去
  actionProvider: ActionProvider,
  messageParser: MessageParser,
};

export default config;
