import { createChatBotMessage } from 'react-chatbot-kit';

const botName = 'PlantBot';

const config = {
  botName: botName,
  initialMessages: [createChatBotMessage(`Hi! I'm ${botName}. Ask me about your plants.`)],
  customStyles: {
    botMessageBox: {
      backgroundColor: '#376B7E',
    },
    chatButton: {
      backgroundColor: '#5ccc9d',
    },
  },
  state: { VoiceEnabled: true }, // Add this property to avoid the error
  widgets: [],
  customComponents: {}, // Add this property to avoid the error

  // customComponents: {}, // Add this property to avoid the error
};

export default config;
