/**
 * File Logging Service
 *
 * Persists user action logs to files via Tauri backend.
 * Logs are stored daily in: {app_data_dir}/logs/openman-YYYY-MM-DD.log
 */

import { invoke } from "@tauri-apps/api/core";

const VERSION = "0.2.0";

export interface LogEntry {
  version: string;
  category: string;
  action: string;
  label?: string;
  value?: string | number | boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Check if running in Tauri environment
 */
async function isTauriEnv(): Promise<boolean> {
  try {
    const { isTauri } = await import("@tauri-apps/api/core");
    return await isTauri();
  } catch {
    return false;
  }
}

/**
 * Write log entry to file
 */
export async function writeLogToFile(entry: LogEntry): Promise<void> {
  const isTauri = await isTauriEnv();

  if (!isTauri) {
    // Fallback to console in web/browser environment
    console.log(`[Openman v${VERSION}] ${entry.category}/${entry.action}`, {
      label: entry.label,
      value: entry.value,
      metadata: entry.metadata,
    });
    return;
  }

  try {
    await invoke("log_user_action", {
      version: VERSION,
      category: entry.category,
      action: entry.action,
      label: entry.label,
      value: entry.value,
      metadata: entry.metadata,
    });
  } catch (error) {
    // Fallback to console if Tauri command fails
    console.error("[Openman] Failed to write log to file:", error);
    console.log(`[Openman v${VERSION}] ${entry.category}/${entry.action}`, entry);
  }
}

/**
 * Read logs for a specific date
 */
export async function readLogs(date: string): Promise<string[]> {
  const isTauri = await isTauriEnv();

  if (!isTauri) {
    console.warn("[Openman] readLogs only available in Tauri environment");
    return [];
  }

  try {
    return await invoke<string[]>("get_logs", { date });
  } catch (error) {
    console.error("[Openman] Failed to read logs:", error);
    return [];
  }
}

/**
 * Get available log dates
 */
export async function getLogDates(): Promise<string[]> {
  const isTauri = await isTauriEnv();

  if (!isTauri) {
    console.warn("[Openman] getLogDates only available in Tauri environment");
    return [];
  }

  try {
    return await invoke<string[]>("get_log_dates_list");
  } catch (error) {
    console.error("[Openman] Failed to get log dates:", error);
    return [];
  }
}

/**
 * Create a logger function that writes to file
 */
export function createFileLogger() {
  return async (event: {
    category: string;
    action: string;
    label?: string;
    value?: string | number | boolean;
    metadata?: Record<string, unknown>;
  }) => {
    await writeLogToFile({
      version: VERSION,
      ...event,
    });
  };
}