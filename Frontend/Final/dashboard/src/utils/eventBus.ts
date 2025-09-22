// src/utils/eventBus.ts

/** Event payload to highlight a metric card on the current page */
export type HighlightDetail = {
  metric:
    | 'temperature'
    | 'humidity'
    | 'light'
    | 'waterLevel'
    | 'soilHumidity'
    | 'steam'
    | 'volume'
    | 'area'
    | 'fruitlets'
    | 'leaves'
    | 'height'
    | 'width';
  /** Optional date in ISO string (YYYY-MM-DD or full timestamp) */
  dateISO?: string;
};

/** Internal event name used for highlight communication */
export const HIGHLIGHT_EVENT = 'plantbot:highlight' as const;

/** Emit a request to highlight a metric card on the current page */
export function emitHighlight(payload: HighlightDetail) {
  window.dispatchEvent(new CustomEvent<HighlightDetail>(HIGHLIGHT_EVENT, { detail: payload }));
}

/** Subscribe to highlight requests (returns unsubscribe) */
export function onHighlight(cb: (d: HighlightDetail) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<HighlightDetail>).detail);
  window.addEventListener(HIGHLIGHT_EVENT, handler);
  return () => window.removeEventListener(HIGHLIGHT_EVENT, handler);
}

/** Event payload to navigate the app (typically fired from chatbot reply button) */
export type NavigateDetail = {
  /** Target route like '/farms/0/buildings/0' */
  path: string;
  /** Optional: date to select after navigation */
  dateISO?: string;
  /** Optional: immediately highlight a metric after navigation */
  metric?: HighlightDetail['metric'];
};

/** Emit a navigation request that the app can handle centrally */
export function emitNavigate(detail: NavigateDetail) {
  window.dispatchEvent(new CustomEvent<NavigateDetail>('chatbot-navigate', { detail }));
}

/** Subscribe to navigation requests (returns unsubscribe) */
export function onNavigate(cb: (d: NavigateDetail) => void) {
  const h = (e: Event) => cb((e as CustomEvent<NavigateDetail>).detail);
  window.addEventListener('chatbot-navigate', h);
  return () => window.removeEventListener('chatbot-navigate', h);
}
