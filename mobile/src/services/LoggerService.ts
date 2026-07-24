/**
 * LoggerService — Captura y persistencia de logs locales para telemetría
 * Almacena logs localmente usando expo-file-system y los sincroniza con /api/logs/batch
 */

import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from '../api/client';
import { useAuthStore } from '../features/auth/store';

export type LogLevel = 'ERROR' | 'WARN' | 'INFO';
export type LogTag = 'UPLOAD' | 'DATABASE' | 'NETWORK' | 'SYSTEM' | 'AUTH';

export interface LogEntry {
  id: string;
  level: LogLevel;
  tag: LogTag;
  message: string;
  details?: any;
  createdAt: string;
  userId?: number | string;
}

const LOG_FILE_PATH = `${FileSystem.documentDirectory}app_logs.json`;
const MAX_LOGS_LIMIT = 300;

async function readLogsFromDisk(): Promise<LogEntry[]> {
  try {
    const info = await FileSystem.getInfoAsync(LOG_FILE_PATH);
    if (!info.exists) return [];
    const content = await FileSystem.readAsStringAsync(LOG_FILE_PATH);
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[LoggerService] Error leyendo logs del disco:', e);
    return [];
  }
}

async function saveLogsToDisk(logs: LogEntry[]): Promise<void> {
  try {
    // Limitar tamaño máximo para evitar consumo excesivo de almacenamiento
    const trimmed = logs.slice(-MAX_LOGS_LIMIT);
    await FileSystem.writeAsStringAsync(LOG_FILE_PATH, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('[LoggerService] Error guardando logs en disco:', e);
  }
}

class LoggerService {
  async log(level: LogLevel, tag: LogTag, message: string, details?: any): Promise<void> {
    const currentUserId = useAuthStore.getState().user?.id;
    const entry: LogEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      level,
      tag,
      message,
      details,
      createdAt: new Date().toISOString(),
      userId: currentUserId,
    };

    if (level === 'ERROR') {
      console.error(`[${tag}] ${message}`, details ?? '');
    } else if (level === 'WARN') {
      console.warn(`[${tag}] ${message}`, details ?? '');
    } else {
      console.log(`[${tag}] ${message}`, details ?? '');
    }

    const currentLogs = await readLogsFromDisk();
    currentLogs.push(entry);
    await saveLogsToDisk(currentLogs);
  }

  async error(tag: LogTag, message: string, details?: any): Promise<void> {
    await this.log('ERROR', tag, message, details);
  }

  async warn(tag: LogTag, message: string, details?: any): Promise<void> {
    await this.log('WARN', tag, message, details);
  }

  async info(tag: LogTag, message: string, details?: any): Promise<void> {
    await this.log('INFO', tag, message, details);
  }

  async getPendingLogs(): Promise<LogEntry[]> {
    return readLogsFromDisk();
  }

  async flushLogsToServer(): Promise<{ success: boolean; count: number }> {
    const logs = await readLogsFromDisk();
    if (logs.length === 0) return { success: true, count: 0 };

    try {
      console.log(`[LoggerService] Enviando ${logs.length} logs al servidor...`);
      const response = await apiClient.post('/logs/batch', { logs }, { timeout: 15000 });
      if (response.status === 200 || response.status === 201) {
        // Limpiar logs tras éxito
        await saveLogsToDisk([]);
        console.log(`[LoggerService] ${logs.length} logs sincronizados correctamente con el servidor.`);
        return { success: true, count: logs.length };
      }
      return { success: false, count: 0 };
    } catch (e: any) {
      console.warn('[LoggerService] Fallo al enviar logs al servidor:', e.message);
      return { success: false, count: 0 };
    }
  }
}

export const logger = new LoggerService();
