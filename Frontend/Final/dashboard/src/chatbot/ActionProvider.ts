// src/chatbot/ActionProvider.ts
import axios from 'axios';
import type { CreateChatBotMessage } from 'react-chatbot-kit';

const baseURL = import.meta.env.VITE_API_BASE ?? 'http://localhost:5000';

type SetState = React.Dispatch<React.SetStateAction<any>>;

// —— Metric 映射与单位 —— //
const METRIC_MAP: Record<string, keyof any> = {
  temperature: 'temperature',
  humidity: 'humidity',
  light: 'light',
  waterlevel: 'waterLevel',
  water_level: 'waterLevel',
  soilhumidity: 'soilHumidity',
  steam: 'steam',
};

const METRIC_UNIT: Record<string, string> = {
  temperature: '°C',
  humidity: '%',
  light: '',
  waterLevel: '',
  soilHumidity: '%',
  steam: '%',
};

// —— 语言检测（中文就回中文，否则英文） —— //
const isZh = (s: string) => /[\u4e00-\u9fa5]/.test(s);

// —— 从页面拿“当前显示的环境数据”（优先 window.__envCurrent，其次 DOM） —— //
function getCurrentEnvFromPage() {
  const g: any = (window as any) || {};
  const cur = g.__envCurrent; // EnvironmentArea 已经写：window.__envCurrent = currentEnvironmentData
  if (cur && typeof cur === 'object') {
    return {
      ok: true,
      data: cur as {
        timestamp?: string;
        temperature?: number;
        humidity?: number;
        light?: number;
        waterLevel?: number;
        soilHumidity?: number;
        steam?: number;
      },
    };
  }

  // 兜底：尝试从带 data-sensor 的元素抓数字（如果你有加的话）
  const readNum = (attr: string) => {
    const el = document.querySelector<HTMLElement>(`[data-sensor="${attr}"]`);
    if (!el) return undefined;
    const m = (el.innerText || el.textContent || '').match(/-?\d+(?:\.\d+)?/);
    return m ? Number(m[0]) : undefined;
  };
  const timestampEl = document.querySelector<HTMLElement>('[data-sensor="timestamp"]');
  return {
    ok: true,
    data: {
      timestamp: timestampEl?.innerText?.trim(),
      temperature: readNum('temperature'),
      humidity: readNum('humidity'),
      light: readNum('light'),
      waterLevel: readNum('waterLevel'),
      soilHumidity: readNum('soilHumidity'),
      steam: readNum('steam'),
    },
  };
}

// —— 统一派发高亮 —— //
function highlight(metric: string, dateISO?: string) {
  window.dispatchEvent(
    new CustomEvent('plantbot:highlight', {
      detail: {
        metric,
        ...(dateISO ? { dateISO } : {}),
      },
    }),
  );
}

export default class ActionProvider {
  createChatBotMessage: CreateChatBotMessage;
  setState: SetState;

  constructor(createChatBotMessage: any, setStateFunc: SetState) {
    this.createChatBotMessage = createChatBotMessage;
    this.setState = setStateFunc;
  }

  private addBotMessage = (text: string) => {
    const message = this.createChatBotMessage(text);
    this.setState((prev: any) => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
    // 记录 & 朗读
    try {
      (window as any).__lastBotText = text;
      (window as any).__speakText?.(text);
    } catch {}
  };

  private isControlIntent = (text: string) =>
    /\b(turn\s+(on|off)|motor|pump|fan|led|light|lamp|bulb)\b/i.test(text);

  private maybeHighlightFromAnswer = (answer: string) => {
    const m = answer.match(/\b(temperature|humidity|light|soilHumidity|waterLevel|steam)\b/i);
    if (m && m[0]) {
      const metric = m[0];
      window.dispatchEvent(new CustomEvent('plantbot:highlight', { detail: { metric } }));
    }
  };

  private async send(text: string) {
    const url = this.isControlIntent(text)
      ? `${baseURL}/api/admin_chat`
      : `${baseURL}/api/chat_simple`;
    const payload = { question: text };
    const { data } = await axios.post(url, payload, { timeout: 15000 });
    const answer = data?.answer ?? data?.response ?? 'No answer.';

    // 如果后端给了 highlight（metric + dateISO），优先用它来高亮并定位日期
    if (data?.highlight && data.highlight.metric) {
      window.dispatchEvent(
        new CustomEvent('plantbot:highlight', {
          detail: {
            metric: data.highlight.metric,
            dateISO: data.highlight.dateISO, // 例如 '2025-04-03T00:00:00'
          },
        }),
      );
    } else {
      // 否则走旧的“从文本里提指标词”的兜底
      const m = (String(answer).match(
        /\b(temperature|humidity|light|soilHumidity|waterLevel|steam)\b/i,
      ) || [])[0];
      if (m) window.dispatchEvent(new CustomEvent('plantbot:highlight', { detail: { metric: m } }));
    }

    return String(answer);
  }

  public async handleUserMessage(text: string) {
    const msg = (text || '').trim();
    try {
      // —— 1) 仅包含一个指标单词？（如：temperature / humidity / light ...）
      const m = msg
        .toLowerCase()
        .match(/^(temperature|humidity|light|water\s*level|waterlevel|soil\s*humidity|steam)$/i);
      if (m) {
        const keyRaw = m[1].toLowerCase().replace(/\s+/g, '');
        const keyMapped = METRIC_MAP[keyRaw] || keyRaw; // 最终属性名（如 waterLevel、soilHumidity）
        const { ok, data } = getCurrentEnvFromPage();

        if (ok && data && keyMapped in (data as any)) {
          const value = (data as any)[keyMapped];
          const ts = data.timestamp || '';
          const unit = METRIC_UNIT[keyMapped] || '';
          const zh = isZh(msg);

          const human = zh
            ? `${ts ? `${ts} ` : ''}当前${keyMapped}是 ${value}${unit}。`
            : `${ts ? `${ts} ` : ''}current ${keyMapped} is ${value}${unit}.`;

          this.addBotMessage(human);

          // 精确高亮：把当前页面正在看的那天（如果 timestamp 有的话）一起带上
          let dateISO: string | undefined = undefined;
          if (ts) {
            // 尝试转换为 'YYYY-MM-DDT00:00:00'
            const d = new Date(ts.includes('T') ? ts : ts.replace(' ', 'T'));
            if (!Number.isNaN(d.getTime())) {
              const y = d.getFullYear();
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const dd = String(d.getDate()).padStart(2, '0');
              dateISO = `${y}-${mm}-${dd}T00:00:00`;
            }
          }
          highlight(keyMapped, dateISO);
          return;
        }
        // 如果页面没有当前数据，退回后端（拿最新记录做回答）
        // —— 注意：此处不 return，继续往下走后台
      }

      // —— 2) 非“单词指标”，或页面没有数据 → 走后端
      const answer = await this.send(msg);
      this.addBotMessage(answer);

      // 如果后端没给 highlight，就从文本里猜一个指标词做高亮
      const guess = (String(answer).match(
        /\b(temperature|humidity|light|soilHumidity|waterLevel|steam)\b/i,
      ) || [])[0];
      if (guess) highlight(guess);
    } catch (err) {
      this.addBotMessage(isZh(msg) ? '出错了，请稍后再试。' : 'Sorry, something went wrong.');
    }
  }
}
