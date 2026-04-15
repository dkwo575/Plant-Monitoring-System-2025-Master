// src/types/chatbot.ts
export interface EnvironmentData {
  temperature: number;
  humidity: number;
  co2: number;
  light: number;
  timestamp: string;
}

export interface PlantImage {
  id: number;
  plantType: string;
  fileName: string;
  captureDate: string;
  path: string;
}
