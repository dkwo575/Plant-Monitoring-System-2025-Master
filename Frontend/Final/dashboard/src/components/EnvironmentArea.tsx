// src/components/EnvironmentArea.tsx
import { Col, Row, Typography, Button, DatePicker } from 'antd';
import EnvironmentStatisticsCard from './EnvironmentStatisticCard';
import AlertCard from './AlertCard';
import EventCard from './EventCard';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';

const { Title } = Typography;

// 后端地址（不想用环境变量就改成 'http://localhost:5000'）
const API_BASE = import.meta.env?.VITE_API_BASE ?? 'http://localhost:5000';

interface Environment {
  id: number;
  temperature: number;
  humidity: number;
  light: number;
  waterLevel: number;
  soilHumidity: number;
  steam: number;
  timestamp: string; // 'YYYY-MM-DD HH:mm:ss' 或 ISO
}

interface Event {
  date: string;
  text: string;
}

interface EnvironmentAreaProps {
  currentEnvironmentData?: Environment[];
  allEnvironmentData?: Environment[];
  allEvents?: Event[];
}

// —— 兼容解析时间（支持 'YYYY-MM-DD HH:mm:ss'、ISO、必要时补 Z）——
function parseTs(ts: string): Date {
  if (!ts) return new Date(NaN);
  const withT = ts.includes('T') ? ts : ts.replace(' ', 'T');
  let d = new Date(withT);
  if (!isNaN(d.getTime())) return d;
  d = new Date(withT + 'Z');
  if (!isNaN(d.getTime())) return d;
  const asNum = Number(ts);
  if (!Number.isNaN(asNum)) {
    d = new Date(asNum);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(NaN);
}

export default function EnvironmentArea(_props: EnvironmentAreaProps) {
  // ======= 组件内部状态（从后端装载）=======
  const [allEnvironmentData, setAllEnvironmentData] = useState<Environment[]>([]);
  const [currentEnvironmentData, setCurrentEnvironmentData] = useState<Environment | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [currentId, setCurrentId] = useState<number>(1);
  const [dateTimes, setDateTimes] = useState<string[]>([]);
  const [highlightMetric, setHighlightMetric] = useState<
    'temperature' | 'humidity' | 'light' | 'waterLevel' | 'soilHumidity' | 'steam' | null
  >(null);

  // ======= 初始化：从后端取数据 =======
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/data`, { timeout: 15000 });
        const envArr: Environment[] = (data ?? []).map((d: any, i: number) => ({
          id: Number(d.id ?? i + 1),
          temperature: Number(d.temperature) || 0,
          humidity: Number(d.humidity) || 0,
          light: Number(d.light) || 0,
          waterLevel: Number(d.waterLevel) || 0,
          soilHumidity: Number(d.soilHumidity) || 0,
          steam: Number(d.steam) || 0,
          timestamp: String(d.timestamp || ''),
        }));
        setAllEnvironmentData(envArr);
        setCurrentId(Math.max(1, envArr.length)); // 默认选最后一条
        setCurrentEnvironmentData(envArr[envArr.length - 1] ?? null);
        setDateTimes(envArr.map((e) => e.timestamp));
        setAllEvents([]); // 没有事件源时给空数组（后续你可接真实事件）
      } catch (e) {
        console.error(e);
        setAllEnvironmentData([]);
        setAllEvents([]);
      }
    };
    load();
  }, []);

  // 基于真实数据做“日期（YYYY-MM-DD）→ 索引”的映射，便于按日期定位
  const dateMap = useMemo(() => {
    const map = new Map<string, number>();
    allEnvironmentData.forEach((d, idx) => {
      const key = (d.timestamp || '').slice(0, 10);
      if (!map.has(key)) map.set(key, idx + 1); // currentId 从 1 开始
    });
    return map;
  }, [allEnvironmentData]);

  // ======= 同步“当前项”变化 =======
  useEffect(() => {
    if (!allEnvironmentData.length) return;
    const idx = Math.max(0, Math.min(allEnvironmentData.length - 1, currentId - 1));
    setCurrentEnvironmentData(allEnvironmentData[idx]);
  }, [currentId, allEnvironmentData]);

  // ======= 暴露最近数据到全局，便于 Chatbot 兜底读取 =======
  useEffect(() => {
    (window as any).__envSeries = allEnvironmentData;
    (window as any).__envCurrent = currentEnvironmentData;
  }, [allEnvironmentData, currentEnvironmentData]);

  // ======= 监听高亮事件（统一用 window 事件）=======
  useEffect(() => {
    const onHL = (e: any) => {
      const metric = e?.detail?.metric;
      const dateISO = e?.detail?.dateISO;
      if (['temperature', 'humidity', 'light', 'waterLevel', 'soilHumidity', 'steam'].includes(metric)) {
        const day = (dateISO || '').slice(0, 10);
        if (day && dateMap.has(day)) setCurrentId(dateMap.get(day)!);
        setHighlightMetric(metric as any);
        setTimeout(() => setHighlightMetric(null), 2000);
      }
    };
    window.addEventListener('plantbot:highlight', onHL as any);
    return () => window.removeEventListener('plantbot:highlight', onHL as any);
  }, [dateMap]);

  // ======= 支持 URL 的 ?date=YYYY-MM-DD 自动定位 =======
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dateISO = params.get('date');
    const day = (dateISO || '').slice(0, 10);
    if (day && dateMap.has(day)) setCurrentId(dateMap.get(day)!);
  }, [dateMap]);

  // ======= 交互：上一条 / 下一条 =======
  const handleNext = () => {
    if (currentId < allEnvironmentData.length) setCurrentId((v) => v + 1);
  };
  const handlePrev = () => {
    if (currentId > 1) setCurrentId((v) => v - 1);
  };

  // ======= 日期选择：在本地数组内定位（不再请求 /timestamp）=======
  const handleTimeChange = (_: any, dateString: string) => {
    // 精确匹配 'YYYY-MM-DD HH:00:00'；若匹配不到，选“同一天里距离最近的一条”
    const exactIdx = allEnvironmentData.findIndex((d) => d.timestamp === dateString);
    if (exactIdx >= 0) {
      setCurrentId(exactIdx + 1);
      return;
    }
    const targetDay = dateString.slice(0, 10);
    let bestIdx = -1;
    let bestDiff = Number.POSITIVE_INFINITY;
    const targetMs = parseTs(dateString).getTime();
    allEnvironmentData.forEach((d, i) => {
      if (d.timestamp.slice(0, 10) === targetDay) {
        const diff = Math.abs(parseTs(d.timestamp).getTime() - targetMs);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIdx = i;
        }
      }
    });
    if (bestIdx >= 0) setCurrentId(bestIdx + 1);
  };

  // ======= 告警（基于相邻两点 10% 变化的简单逻辑）=======
  const icons = {
    temperature: 'device_thermostat',
    light: 'fluorescent',
    humidity: 'humidity_percentage',
    waterLevel: 'humidity_high',
    soilHumidity: 'water',
    steam: 'rainy',
  } as const;

  const alerts: { direction: 'up' | 'down'; text: string; icon: string; date: string }[] = [];
  if (allEnvironmentData && allEnvironmentData.length >= 2) {
    for (let i = allEnvironmentData.length - 1; i > 0; i--) {
      for (const key of ['temperature', 'humidity', 'light', 'waterLevel', 'soilHumidity', 'steam'] as const) {
        if (allEnvironmentData[i][key] > allEnvironmentData[i - 1][key] * 1.1) {
          alerts.push({ direction: 'up', text: `Rise in ${key}`, icon: icons[key], date: allEnvironmentData[i].timestamp });
        }
        if (allEnvironmentData[i][key] < allEnvironmentData[i - 1][key] * 0.9) {
          alerts.push({ direction: 'down', text: `Fall in ${key}`, icon: icons[key], date: allEnvironmentData[i].timestamp });
        }
      }
    }
  }

  // ======= 横向滚动容器的滚轮同步 =======
  const handleScroll = (event: WheelEvent) => {
    const container = event.currentTarget as Element;
    const scrollAmount = event.deltaY;
    container.scrollTo({ top: 0, left: (container as any).scrollLeft + scrollAmount, behavior: 'auto' });
  };

  return (
    <>
      <Row>
        <Col>
          <Title level={4} style={{ marginTop: 20 }}>
            Environment (IoT sensor)
          </Title>
        </Col>
      </Row>

      <Row>
        <Col span={8}>
          <Button onClick={handlePrev} disabled={currentId <= 1}>
            Previous
          </Button>
        </Col>

        <Col span={8} style={{ textAlign: 'center' }}>
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:00:00"
            onChange={(_, dateString) => handleTimeChange(undefined, dateString as string)}
            style={{ width: '100%' }}
            value={undefined /* 不强制受控 */}
          />
        </Col>

        <Col span={8} style={{ textAlign: 'right' }}>
          <Button onClick={handleNext} disabled={currentId >= allEnvironmentData.length}>
            Next
          </Button>
        </Col>
      </Row>

      <Row gutter={[8, 8]}>
        <Col span={12}>
          <div className={highlightMetric === 'temperature' ? 'highlight-pulse' : undefined}>
            <EnvironmentStatisticsCard icon="device_thermostat" text="Temperature" value={<>{currentEnvironmentData?.temperature ?? 0} ℃</>} />
          </div>
        </Col>
        <Col span={12}>
          <div className={highlightMetric === 'humidity' ? 'highlight-pulse' : undefined}>
            <EnvironmentStatisticsCard icon="humidity_percentage" text="Humidity" value={<>{currentEnvironmentData?.humidity ?? 0} %</>} />
          </div>
        </Col>
        <Col span={12}>
          <div className={highlightMetric === 'light' ? 'highlight-pulse' : undefined}>
            <EnvironmentStatisticsCard icon="fluorescent" text="Light" value={<>{currentEnvironmentData?.light ?? 0}</>} />
          </div>
        </Col>
        <Col span={12}>
          <div className={highlightMetric === 'waterLevel' ? 'highlight-pulse' : undefined}>
            <EnvironmentStatisticsCard icon="water_full" text="WaterLevel" value={<>{currentEnvironmentData?.waterLevel ?? 0} %</>} />
          </div>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col span={12}>
          <div className={highlightMetric === 'soilHumidity' ? 'highlight-pulse' : undefined}>
            <EnvironmentStatisticsCard icon="water" text="SoilHumidity" value={<>{currentEnvironmentData?.soilHumidity ?? 0} %</>} />
          </div>
        </Col>
        <Col span={12}>
          <div className={highlightMetric === 'steam' ? 'highlight-pulse' : undefined}>
            <EnvironmentStatisticsCard icon="rainy" text="Steam" value={<>{currentEnvironmentData?.steam ?? 0} %</>} />
          </div>
        </Col>
        <Col span={12}>
          <EnvironmentStatisticsCard icon="date_range" text="Date" value={<>{currentEnvironmentData?.timestamp ?? 'No date'}</>} />
        </Col>
      </Row>

      <Row>
        <Col>
          <Title level={4} style={{ marginTop: 20 }}>
            Alerts
          </Title>
        </Col>
      </Row>
      <Row>
        <Col
          span={24}
          style={{ display: 'flex', gap: 8, overflowX: 'auto' }}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          onWheel={handleScroll}
        >
          {alerts.map((alert) => (
            <AlertCard key={alert.date + alert.text} {...alert} />
          ))}
        </Col>
      </Row>
      <Row>
        <Col>
          <Title level={4} style={{ marginTop: 20 }}>
            Events
          </Title>
        </Col>
      </Row>
      <Row>
        <Col
          span={24}
          style={{ display: 'flex', gap: 8, overflowX: 'auto' }}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          onWheel={handleScroll}
        >
          {allEvents.map((event) => (
            <EventCard key={event.date + event.text} {...event} />
          ))}
        </Col>
      </Row>
    </>
  );
}
