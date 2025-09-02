// import { MessageParser as IMessageParser } from 'react-chatbot-kit';

// class MessageParser implements IMessageParser {
//   actionProvider: any;

//   constructor(actionProvider: any) {
//     this.actionProvider = actionProvider;
//   }

//   parse(message: string) {
//     this.actionProvider.handleUserMessage(message);
//   }
// }

// export default MessageParser;

// ----------------- 2nd version -----------------
import axios from 'axios';

class MessageParser {
  actionProvider: any;

  constructor(actionProvider: any) {
    this.actionProvider = actionProvider;
  }

  async parse(message: string) {
    try {
      const res = await axios.post('http://localhost:5000/api/chat_simple', {
        question: message,
      });
      console.log('MessageParser:', message);

      const answer = res.data.answer;
      this.actionProvider.handleResponse(answer);
    } catch (error) {
      console.error('Error fetching answer:', error);
      this.actionProvider.handleResponse('Sorry, something went wrong.');
    }

    // try {
    //   const respon = await axios.post('http://')
    // }
  }
}

export default MessageParser;

// ----------------- 3rd version -----------------
// import { MessageParser } from 'react-chatbot-kit';

// const MessageParser = ({ message, actionProvider }: MessageParser) => {
//   if (message) {
//     actionProvider.handleUserMessage(message);
//   }
// };

// export default MessageParser;

// ------------------ 4th version

// class MessageParser {
//   actionProvider: any;

//   constructor(actionProvider: any) {
//     this.actionProvider = actionProvider;
//   }

//   parse(message: string) {
//     const lowerCaseMessage = message.toLowerCase();

//     // Handle the user message here and call the appropriate actionProvider methods
//     this.actionProvider.handleResponse(`You said: ${message}`);
//   }
// }

// export default MessageParser;
