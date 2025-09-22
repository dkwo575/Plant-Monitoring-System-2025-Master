// src/chatbot/ChatbotNavigateButton.tsx
import React from 'react';

type Props = {
  to: string;
  label?: string;
};

const ChatbotNavigateButton: React.FC<Props> = ({ to, label }) => {
  const onClick = () => {
    // 你也可以 dispatch 自定义事件给路由层处理
    try {
      window.dispatchEvent(new CustomEvent('plantbot:navigate', { detail: { to } }));
    } catch {}
    // 简单方式：直接跳转
    window.location.assign(to);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <button
        onClick={onClick}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #ddd',
          cursor: 'pointer',
        }}
      >
        {label || 'View details'}
      </button>
    </div>
  );
};

export default ChatbotNavigateButton;
