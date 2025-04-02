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

class MessageParser {
  actionProvider: any;

  constructor(actionProvider: any) {
    this.actionProvider = actionProvider;
  }

  parse(message: string) {
    this.actionProvider.handleUserMessage(message);
  }
}

export default MessageParser;
