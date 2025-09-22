// src/chatbot/ChatbotComponent.tsx
import React, { useEffect, useState, useRef } from 'react';
import { Chatbot, createChatBotMessage, createClientMessage } from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import { Switch } from 'antd';

import config from '../chatbot/configchatbot';
import MessageParser from '../chatbot/MessageParser';
import ActionProvider from '../chatbot/ActionProvider';
import '../chatbot/ChatbotComponent.css';

// === 根据语音开关构造 config（保留你原有写法） ===
const createCustomConfig = (voiceEnabled: boolean) => {
  return {
    ...config,
    customComponents: {
      ...config.customComponents,
    },
    initialState: {
      ...config.state,
      voiceEnabled,
    },
  };
};

const ChatbotComponent: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(false);
  const [customConfig, setCustomConfig] = useState<any>(createCustomConfig(voiceEnabled));

  const [isListening, setIsListening] = useState<boolean>(false);
  const [sttText, setSttText] = useState('');
  // const [autoSend, setAutoSend] = useState(false);

  const recognitionRef = useRef<any>(null);
  const chatbotActionProviderRef = useRef<any>(null); // 用来保存真正的 ActionProvider 实例

  // —— 可选：UI 快照（如果以后 ActionProvider 需要，也可通过 window 读到）——
  const [envState, setEnvState] = useState({
    temperature: 0,
    humidity: 0,
    light: 0,
    soilHumidity: 0,
    waterLevel: 0,
    steam: 0,
  });

  useEffect(() => {
    if (!isOpen) return;
    const readNumber = (sel: string) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return null;
      const m = (el.innerText || el.textContent || '').match(/-?\d+(?:\.\d+)?/);
      return m ? Number(m[0]) : null;
    };
    const domSnapshot = {
      temperature: readNumber('[data-sensor="temperature"]') ?? envState.temperature,
      humidity: readNumber('[data-sensor="humidity"]') ?? envState.humidity,
      light: readNumber('[data-sensor="light"]') ?? envState.light,
      soilHumidity: readNumber('[data-sensor="soilHumidity"]') ?? envState.soilHumidity,
      waterLevel: readNumber('[data-sensor="waterLevel"]') ?? envState.waterLevel,
      steam: readNumber('[data-sensor="steam"]') ?? envState.steam,
    };
    setEnvState(domSnapshot);
  }, [isOpen]); // 仅在打开时更新一次

  // —— 欢迎语（语音）——
  const greetingText = "Hi! I'm PlantBot. Ask me about your plants.";
  const greetingSpokenRef = useRef(false);
  useEffect(() => {
    if (isOpen && voiceEnabled && !greetingSpokenRef.current) {
      greetingSpokenRef.current = true;       // 先置位，避免重复
      speakText("Hi! I'm PlantBot. Ask me about your plants.");
    }
  }, [isOpen, voiceEnabled]);

  // —— 将文本写入聊天输入框（用于 STT 手动发送模式）——
  const putIntoChatInput = (text: string) => {
    const input =
      document.querySelector<HTMLInputElement>('.react-chatbot-kit-chat-input') ||
      document.querySelector<HTMLTextAreaElement>('.react-chatbot-kit-chat-input');
    if (!input) return;

    const proto = Object.getPrototypeOf(input);
    const valueSetter =
      Object.getOwnPropertyDescriptor(proto, 'value')?.set ||
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set ||
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;

    if (valueSetter) valueSetter.call(input, text);
    else (input as any).value = text;

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    input.focus();
    const len = text.length;
    (input as any).setSelectionRange?.(len, len);
  };

  // —— 从语音结果直接发送 —— 
  const sendMessageFromSTT = async (text: string) => {
    const msg = text.trim();
    if (!msg) return;

    // 先把“用户消息”插入到对话
    chatbotActionProviderRef.current?.setState((prev: any) => ({
      ...prev,
      messages: [...(prev.messages || []), createClientMessage(msg)],
    }));

    // 再调用 ActionProvider 的处理函数
    await chatbotActionProviderRef.current?.handleUserMessage(msg);
  };

  // —— 朗读（TTS）——
  const speakText = (raw: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;

    const text = String(raw ?? '')
      .replace(/\n+/g, ' ')
      .replace(/^Result:\s*/i, '')
      .trim();
    if (!text) return;

    const synth = window.speechSynthesis;
    // 防抖：若队列里有，先清
    synth.cancel();

    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(text);
      const wantZh = /[\u4e00-\u9fa5]/.test(text);
      const prefer = wantZh ? 'zh' : 'en';
      const voices = synth.getVoices() || [];
      const voice =
        voices.find((v) => v.lang?.toLowerCase().startsWith(prefer)) ||
        voices.find((v) => v.default) ||
        voices[0];
      if (voice) {
        utt.voice = voice;
        utt.lang = voice.lang || (wantZh ? 'zh-CN' : 'en-US');
      } else {
        utt.lang = wantZh ? 'zh-CN' : 'en-US';
      }
      utt.rate = 1.0;
      utt.pitch = 1.0;
      synth.speak(utt);
    };

    // 有些浏览器第一次需要等待 voices 加载，但要避免“既监听又立即 speak”重复
    if ((window.speechSynthesis.getVoices() || []).length === 0) {
      const once = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', once);
        doSpeak();
      };
      window.speechSynthesis.addEventListener('voiceschanged', once);
    } else {
      doSpeak();
    }
  };


  // 供外部调 TTS
  (window as any).__speakText = (text: string) => {
    try {
      if (voiceEnabled) speakText(String(text ?? ''));
    } catch { }
  };

  // —— 语音偏好持久化 —— 
  useEffect(() => {
    const saved = localStorage.getItem('voice-enabled');
    const initial = saved !== null ? saved === 'true' : true;
    setVoiceEnabled(initial);
    setCustomConfig(createCustomConfig(initial));
  }, []);
  useEffect(() => {
    setCustomConfig(createCustomConfig(voiceEnabled));
  }, [voiceEnabled]);

  const toggleChatbot = () => setIsOpen((prev) => !prev);

  // —— 语音识别（STT）——
  const startListening = () => {
    if (!voiceEnabled) {
      alert('Voice input is disabled. Please enable voice in the settings to use this feature.');
      return;
    }
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser.');
      return;
    }
    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = 'en-US';

    setIsListening(true);
    setSttText('');
    let finalText = '';
    let lastDraft = '';

    rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim += t;
      }
      lastDraft = (finalText + interim).trim();
      setSttText(lastDraft);
      if (!autoSend) putIntoChatInput(lastDraft);
    };
    rec.onerror = (err: any) => {
      console.error('STT error:', err);
      setIsListening(false);
    };
    rec.onend = () => {
      setIsListening(false);
      const text = (lastDraft || finalText || '').trim();
      if (!text) return;
      // 只把结果放进输入框，不自动发送
      setSttText(text);
      putIntoChatInput(text);
    };

    rec.start();
  };
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  /**
   * ✅ 关键改动：
   * 我们不再向 ActionProvider 传“自定义对象参数”，而是遵循 react-chatbot-kit 的标准构造：
   * new ActionProvider(createChatBotMessage, setState)
   * 为了继续拿到实例（用于 STT 直接发送），用一个轻量“代理类”把真实实例存到 ref 上。
   */
  const customActionProvider = class {
    constructor(createChatBotMessage: any, setStateFunc: any /*, navigate?: any */) {
      const real = new ActionProvider(createChatBotMessage, setStateFunc);
      chatbotActionProviderRef.current = real;
      Object.setPrototypeOf(this, real);
      Object.assign(this, real);
      return real;
    }
  };

  return (
    <div>
      {/* toggle 按钮 */}
      <button
        onClick={toggleChatbot}
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
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        title={isOpen ? 'Close' : 'Open'}
      >
        {isOpen ? '✖' : '💬'}
      </button>

      {/* 面板 */}
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
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 9999,
        }}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>Voice:</span>
          <Switch
            checked={voiceEnabled}
            onChange={(checked) => {
              localStorage.setItem('voice-enabled', checked.toString());
              setVoiceEnabled(checked);
              setCustomConfig(createCustomConfig(checked));
            }}
            style={{ marginRight: 12 }}
          />

          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!voiceEnabled}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: isListening ? '#E53935' : voiceEnabled ? '#673AB7' : '#ccc',
              color: '#fff',
              fontWeight: 600,
              cursor: voiceEnabled ? 'pointer' : 'not-allowed',
              opacity: voiceEnabled ? 1 : 0.6,
            }}
          >
            {isListening ? '■ Stop' : '🎤 Speak'}
          </button>

          {/* <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={autoSend}
              onChange={(e) => setAutoSend(e.target.checked)}
            />
            Auto-send
          </label> */}

          <button
            onClick={() => {
              const last = (window as any).__lastBotText;
              speakText(last || 'No recent reply.');
            }}
            disabled={!voiceEnabled}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              border: 'none',
              backgroundColor: voiceEnabled ? '#2196F3' : '#ccc',
              color: '#fff',
              fontWeight: 600,
              cursor: voiceEnabled ? 'pointer' : 'not-allowed',
              opacity: voiceEnabled ? 1 : 0.6,
            }}
          >
            🔊 Test TTS
          </button>
        </div>

        {/* 聊天主体 */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <Chatbot
            config={customConfig}
            messageParser={MessageParser}
            actionProvider={customActionProvider}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatbotComponent;
