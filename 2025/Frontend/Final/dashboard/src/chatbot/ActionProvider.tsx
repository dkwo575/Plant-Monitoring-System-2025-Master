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

// class ActionProvider {
//   createChatBotMessage: any;
//   setState: any;

//   constructor(createChatBotMessage: any, setStateFunc: any) {
//     this.createChatBotMessage = createChatBotMessage;
//     this.setState = setStateFunc;
//   }

//   async handleUserMessage(message: string) {
//     const response = await fetch('http://localhost:5000/api/chat_simple', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ message }),
//     });

//     const data = await response.json();

//     const botMessage = this.createChatBotMessage(data.reply);

//     this.setState((prev: any) => ({
//       ...prev,
//       messages: [...prev.messages, botMessage],
//     }));
//   }
// }

// export default ActionProvider;

// --------------------------------------------------------------------------------------------------

// Action Provider

import { createChatBotMessage } from 'react-chatbot-kit';
import axios from 'axios';

class ActionProvider {
  setState: any;
  createChatBotMessage: any;
  navigate: any;
  voiceEnabled = true; // Default to true

  constructor(createChatBotMessage: any, setStateFunc: any, navigate: any, voiceEnabled: boolean) {
    this.setState = setStateFunc;
    this.createChatBotMessage = createChatBotMessage;
    this.navigate = navigate;
    this.voiceEnabled = voiceEnabled; // Set the voiceEnabled property

    this.handleResponse = this.handleResponse.bind(this);
  }

  handleResponse(response: string) {
    let responseText = '';

    if (typeof response === 'object') {
      responseText = JSON.stringify(response, null, 2);
    } else {
      responseText = response;
    }

    const botMessage = this.createChatBotMessage(response);
    // Only speak if voice is enabled
    console.log('Setting state with botMessage:', botMessage);
    console.log('handleResponse called with response:', responseText);
    console.log('response:', response);
    this.setState((prevState: any) => {
      const oldMessages = prevState.messages || [];
      return {
        ...prevState,
        messages: [...oldMessages, botMessage],
      };
    });

    // const message = this.createChatBotMessage(response);
    // this.setState((prevState: any) => ({
    //   ...prevState,
    //   messages: [...prevState.messages, message],
    // }));
  }

  // greet() {
  //   const message = this.createChatBotMessage('Hello! How can I help you?');
  //   this.setState((prev: any) => ({
  //     ...prev,
  //     messages: [...prev.messages, message],
  //   }));
  // }

  // handleResponse(response: any) {
  //   let responseText = '';

  //   // If response is an object (e.g., { query: "...", result: [...] }), stringify it
  //   if (typeof response === 'object') {
  //     responseText = JSON.stringify(response, null, 2);
  //   } else {
  //     responseText = response;
  //   }

  //   const botMessage = this.createChatBotMessage(responseText);

  //   // Only speak if voice is enabled
  //   // if (this.voiceEnabled) {
  //   //   // && window.speechSynthesis) {
  //   //   // Cancel any previous speech
  //   //   window.speechSynthesis.cancel();

  //   if (this.voiceEnabled && window.speechSynthesis) {
  //     window.speechSynthesis.cancel();
  //     const utterance = new SpeechSynthesisUtterance(responseText);
  //     utterance.lang = 'en-US';
  //     utterance.rate = 1.0;
  //     utterance.pitch = 1.0;
  //     window.speechSynthesis.speak(utterance);
  //   }

  //   // Create and configure new speech utterance
  //   // const utterance = new SpeechSynthesisUtterance(responseText);
  //   // utterance.lang = 'en-US';
  //   // utterance.rate = 1.0; // Normal speaking rate
  //   // utterance.pitch = 1.0; // Normal pitch

  //   // window.speechSynthesis.speak(utterance);

  //   // }
  //   // const utterence = new SpeechSynthesisUtterance(responseText);
  //   // utterence.lang = 'en-US';
  //   // window.speechSynthesis.speak(utterence);

  //   this.setState((prevState: any) => {
  //     const oldMessages = prevState.messages || []; // <- ⚡ fix: protect from undefined

  //     return {
  //       ...prevState,
  //       messages: [...oldMessages, botMessage],
  //     };
  //   });
  // }

  // Add a method to check if voice is enabled
  isVoiceEnabled() {
    return this.voiceEnabled;
  }

  // Add a method to toggle voice
  setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }
}

export default ActionProvider;

// -----------
