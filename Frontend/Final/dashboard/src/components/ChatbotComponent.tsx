import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Chatbot, createChatBotMessage } from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import { Card, Col, Row, Typography, Switch } from 'antd';
import { MaterialSymbol } from 'react-material-symbols';
import theme from '../theme';

import config from '../chatbot/configchatbot';
import MessageParser from '../chatbot/MessageParser';
import ActionProvider from '../chatbot/ActionProvider';
import '../chatbot/ChatbotComponent.css';
import { set } from 'lodash-es';
import { act } from 'react-dom/test-utils';

// Create custom config with voice settings
const createCustomConfig = (voiceEnabled: boolean) => {
  return {
    ...config,
    // Pass voiceEnabled to the ActionProvider
    customComponents: {
      ...config.customComponents,
    },
    // Add voiceEnabled to the initialState
    initialState: {
      ...config.state,
      voiceEnabled,
    },
  };
};

const ChatbotComponent: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true); // voice toggle
  const [customConfig, setCustomConfig] = useState<any>(createCustomConfig(true)); // custom config

  const [isListening, setIsListening] = useState<boolean>(false); // listening state

  const [chatbotState, setChatbotState] = useState<any>(null); // chatbot state
  const [chatbotActionProvider, setChatbotActionProvider] = useState<any>(null); // chatbot action provider

  const recognitionRef = useRef<any>(null); // reference to the SpeechRecognition instance
  const chatbotstateRef = useRef<any>(null); // reference to the chatbot state
  const chatbotActionProviderRef = useRef<any>(null); // reference to the chatbot action provider

  // ------------------------ new function 27/05/25 -------
  // Add TTS function
  const speakText = (text: string) => {
    console.log('speakText called with:', text);
    console.log('voiceEnabled:', voiceEnabled);
    console.log('speechSynthesis available:', !!window.speechSynthesis);

    if (!voiceEnabled) {
      console.log('Voice is disabled, skipping TTS');
      return;
    }

    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported');
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech synthesis

      // Clean the text (remove extra formatting)
      const cleanText = text
        .replace(/\n/g, ' ')
        .replace(/Result:\s*/g, '')
        .trim();
      console.log('Clean text for TTS:', cleanText);

      if (!cleanText || cleanText.length === 0) {
        console.log('No text to speak');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Add event listeners for debugging
      utterance.onstart = () => {
        console.log('TTS started');
      };

      utterance.onend = () => {
        console.log('TTS ended');
      };

      utterance.onerror = (event) => {
        console.error('TTS error:', event);
      };

      // Wait a bit before speaking (sometimes needed for browser compatibility)
      setTimeout(() => {
        console.log('Starting speech synthesis...');
        window.speechSynthesis.speak(utterance);
      }, 100);
    } catch (error) {
      console.error('Error in speech synthesis:', error);
    }
  };
  // --------------------------------

  useEffect(() => {
    const savedVoicePreference = localStorage.getItem('voice-enabled');
    const initialValue = savedVoicePreference !== null ? savedVoicePreference === 'true' : true;
    setVoiceEnabled(initialValue);
    setCustomConfig(createCustomConfig(initialValue));
  }, []);

  useEffect(() => {
    setCustomConfig(createCustomConfig(voiceEnabled));
  }, [voiceEnabled]);

  const toggleChatbot = () => {
    setIsOpen((prev) => !prev);
  };

  // // control motor

  // const moveMotor = async (angle: number) => {
  //   await axios('http://localhost:5000/api/move_motor', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ angle }),
  //   });
  // };

  // console.log('moveMotor', moveMotor);

  const startListening = () => {
    if (!voiceEnabled) {
      alert('Voice input is disabled. Please enable voice in the settings to use this feature.');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser.');
      return;
    }

    // if (!voiceEnabled) return;

    // const SpeechRecognition =
    //   (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // if (!SpeechRecognition) {
    //   console.error('Speech recognition not supported in this browser.');
    //   return;
    // }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // recognition.start();

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('User said:', transcript);

      const userMessage = createChatBotMessage(transcript, { withAvatar: false });

      // setChatbotState((prev: any) => ({
      //   ...prev,
      //   messages: [...prev.messages, userMessage],
      // }));

      // 1. Show user message in chat window
      // if (chatbotState) {
      //   chatbotState((prevState: any) => ({
      //     ...prevState,
      //     messages: [...prevState.messages, userMessage],
      //   }));
      // }

      if (chatbotActionProviderRef.current && chatbotActionProviderRef.current.setState) {
        chatbotActionProviderRef.current.setState((prevState: any) => ({
          ...prevState,
          messages: [...(prevState.messages || []), userMessage],
        }));
      }

      try {
        // 2. Send directly to backend
        const res = await axios.post('http://localhost:5000/api/chat_simple', {
          question: transcript,
        });

        const answer = res.data.answer;
        console.log('Raw answer from backend:', answer);
        console.log('Answer type:', typeof answer);

        // Extract clean text from the response
        let cleanAnswer = answer;
        if (typeof answer === 'string') {
          // Remove "Result:" prefix and clean up formatting
          cleanAnswer = answer
            .replace(/^Result:\s*/i, '')
            .replace(/\n+/g, ' ')
            .trim();
        }
        console.log('Clean answer for TTS:', cleanAnswer);

        // 3. Manually trigger ActionProvider response
        // const actionProvider = new ActionProvider(
        //   createChatBotMessage,
        //   chatbotState,
        //   null,
        //   voiceEnabled,
        // );

        // 3. Create bot message with original answer (for display)
        const botMessage = createChatBotMessage(answer);

        // 4. Add bot message to chat and speek to response

        // 4. Add bot message to chat AND speak after state update is complete
        if (chatbotActionProviderRef.current && chatbotActionProviderRef.current.setState) {
          chatbotActionProviderRef.current.setState((prevState: any) => {
            const newState = {
              ...prevState,
              messages: [...(prevState.messages || []), botMessage],
            };

            // if (chatbotActionProviderRef.current && chatbotActionProviderRef.current.setState) {
            //   chatbotActionProviderRef.current.setState((prevState: any) => ({
            //     ...prevState,
            //     messages: [...(prevState.messages || []), botMessage],
            //   }));
            // chatbotActionProviderRef.current.handleResponse(answer);
            // 5. speek the response

            // 5. Use setTimeout to ensure the state update is processed before speaking
            setTimeout(() => {
              console.log('About to call speakText with clean answer:', cleanAnswer);
              speakText(cleanAnswer);
            }, 100);

            return newState;
          });
        }

        // 4. Show bot response in chat window
      } catch (error) {
        console.error('Error sending to backend:', error);
        const errorMessage = createChatBotMessage('Sorry, something went wrong.');

        if (chatbotActionProviderRef.current && chatbotActionProviderRef.current.setState) {
          chatbotActionProviderRef.current.setState((prevState: any) => ({
            ...prevState,
            messages: [...(prevState.messages || []), errorMessage],
          }));

          speakText('Sorry, something went wrong.');
        }
      }
    };

    //   // Find Chatbot input textarea and set the value
    //   const inputEl = document.querySelector<HTMLInputElement>('.react-chatbot-kit-chat-input');
    //   const form = document.querySelector<HTMLFormElement>('.react-chatbot-kit-chat-btn-send');

    //   if (inputEl) {
    //     inputEl.value = transcript;
    //     inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    //   }

    //   // Trigger enter/send
    //   // if (form) {
    //   //   form.click();
    //   // }

    //   // simulate pressing enter key
    //   const enterKeyEvent = new KeyboardEvent('keydown', {
    //     bubbles: true,
    //     cancelable: true,
    //     key: 'Enter',
    //     code: 'Enter',
    //     charCode: 13,
    //     keyCode: 13,
    //     which: 13,
    //   });
    //   inputEl?.dispatchEvent(enterKeyEvent);
    //   // form.dispatchEvent(enterKeyEvent);
    // };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      alert('Error occurred in recognition: ' + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Create custom ActionProvider with voice settings
  // const customActionProvider = (props: any) => {
  //   const actionProvider = new ActionProvider(
  //     props.createChatBotMessage,
  //     props.setState,
  //     undefined,
  //     voiceEnabled,
  //   ); // new
  // Create custom ActionProvider class with voice settings
  const customActionProvider = class {
    constructor(createChatBotMessage: any, setStateFunc: any, navigate: any) {
      const actionProvider = new ActionProvider(
        createChatBotMessage,
        setStateFunc,
        navigate,
        voiceEnabled,
      );

      // new things
      // store references for SST usage
      chatbotActionProviderRef.current = actionProvider; // new

      // Copy all methods from ActionProvider to this instance
      Object.setPrototypeOf(this, actionProvider);
      Object.assign(this, actionProvider);

      return actionProvider; // new
    }
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
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
        }}
      >
        {isOpen ? '✖' : '💬'}
      </button>

      {/* voice button */}

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              bottom: '90px',
              right: '30px',
              width: '100%',
              maxWidth: '500px',
              height: '100%',
              maxHeight: '700px',
              borderRadius: '10px',
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.2)',
              backgroundColor: 'white',
              padding: '10px',
            }}
          >
            <span style={{ marginRight: 8 }}>Voice:</span>
            <Switch
              checked={voiceEnabled}
              onChange={(checked) => {
                localStorage.setItem('voice-enabled', checked.toString());
                setVoiceEnabled(checked);
              }}
              style={{ marginRight: 12 }}
            />
          </div>
        </>
      )}

      {/* chatbot component */}

      <div
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '100%',
          maxWidth: '500px',
          height: '100%',
          maxHeight: '700px',
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
        <span>
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!voiceEnabled}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: voiceEnabled ? '#4CAF50' : '#ccc',
              color: 'white',
              fontWeight: 'bold',
              cursor: voiceEnabled ? 'pointer' : 'not-allowed',
              opacity: voiceEnabled ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
            }}
          >
            <span>{isListening ? '⏹ Stop Listening' : '🎙 Start Listening'}</span>
          </button>
          {/* <Chatbot config={config} messageParser={MessageParser} actionProvider={ActionProvider} /> */}
          {/* Test TTS Button */}
          <button
            onClick={() => speakText('The today temperature is 21 degrees Celsius.')}
            disabled={!voiceEnabled}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: 'none',
              backgroundColor: voiceEnabled ? '#2196F3' : '#ccc',
              color: 'white',
              fontWeight: 'bold',
              cursor: voiceEnabled ? 'pointer' : 'not-allowed',
              opacity: voiceEnabled ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.3s ease',
              fontSize: '12px',
              flex: 1,
            }}
          >
            <span>🔊 TTS button </span>
          </button>
        </span>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Chatbot
            config={customConfig}
            messageParser={MessageParser}
            actionProvider={
              customActionProvider
              // class CustomActionProvider extends ActionProvider {
              //   constructor(createChatBotMessage: any, setStateFunc: any, navigate: any) {
              //     super(createChatBotMessage, setStateFunc, navigate, voiceEnabled);
              //     chatbotActionProviderRef.current = this;
              //     chatbotstateRef.current = setStateFunc;
              //   }
            }
          />
        </div>
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

// ------------ version 2--------------
