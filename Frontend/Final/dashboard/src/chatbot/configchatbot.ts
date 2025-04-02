import { createChatBotMessage } from 'react-chatbot-kit';

const botName = 'PlantBot';

const config = {
  botName: botName,
  initialMessages: [createChatBotMessage(`Hi! I'm ${botName}. Ask me about your plants.`)],
};

export default config;
