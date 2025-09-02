// import { ActionProvider as IActionProvider, createChatBotMessage } from 'react-chatbot-kit';
// import axios from 'axios';

// class ActionProvider implements IActionProvider {
//   createChatBotMessage: typeof createChatBotMessage;
//   setState: (stateFunc: (prevState: any) => any) => void;

//   constructor(
//     createChatBotMessage: typeof createChatBotMessage,
//     setStateFunc: (stateFunc: (prevState: any) => any) => void,
//   ) {
//     this.createChatBotMessage = createChatBotMessage;
//     this.setState = setStateFunc;
//   }

//   async handleUserMessage(message: string) {
//     try {
//       const response = await axios.post('http://127.0.0.1:5000/chat', { message });

//       const botMessage = this.createChatBotMessage(response.data.response);

//       this.setState((prev) => ({
//         ...prev,
//         messages: [...prev.messages, botMessage],
//       }));
//     } catch (error) {
//       console.error('Error:', error);
//       const errorMessage = this.createChatBotMessage("Sorry, I couldn't fetch data.");
//       this.setState((prev) => ({
//         ...prev,
//         messages: [...prev.messages, errorMessage],
//       }));
//     }
//   }
// }

// export default ActionProvider;

// --------------------------------------------------------------------------------------------------
// 2nd version

class ActionProvider {
  createChatBotMessage: any;
  setState: any;

  constructor(createChatBotMessage: any, setStateFunc: any) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
  }

  async handleUserMessage(message: string) {
    const response = await fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();

    const botMessage = this.createChatBotMessage(data.reply);

    this.setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, botMessage],
    }));
  }
}

export default ActionProvider;

// --------------------------------------------------------------------------------------------------

// 3rd version
// import axios from 'axios';
// import { createChatBotMessage } from 'react-chatbot-kit';

// class ActionProvider {
//   createChatBotMessage: any;
//   setState: any;

//   constructor(createChatBotMessage, setStateFunc) {
//     this.createChatBotMessage = createChatBotMessage;
//     this.setState = setStateFunc;
//   }

//   async handleQuery(query: string) {
//     try {
//       const response = await axios.post('http://localhost:5000/query', { query });
//       const messageText = response.data.response || "Sorry, I couldn't retrieve that information.";

//       const botMessage = this.createChatBotMessage(messageText);
//       this.setState((prev) => ({
//         ...prev,
//         messages: [...prev.messages, botMessage],
//       }));
//     } catch (error) {
//       console.error('Error fetching data:', error);
//     }
//   }
// }

// export default ActionProvider;
