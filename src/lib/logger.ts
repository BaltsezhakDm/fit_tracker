type LogLevel = 'info' | 'error' | 'warn' | 'action' | 'api';

const COLORS = {
  info: '#3b82f6',   // blue
  error: '#ef4444',  // red
  warn: '#f59e0b',   // amber
  action: '#10b981', // emerald
  api: '#8b5cf6'     // violet
};

class Logger {
  private formatMessage(level: LogLevel, message: string): string[] {
    const timestamp = new Date().toLocaleTimeString();
    return [
      `%c[${timestamp}] [${level.toUpperCase()}] ${message}`,
      `color: ${COLORS[level]}; font-weight: bold;`
    ];
  }

  info(message: string, ...args: any[]) {
    console.log(...this.formatMessage('info', message), ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(...this.formatMessage('error', message), ...args);
  }

  warn(message: string, ...args: any[]) {
    console.warn(...this.formatMessage('warn', message), ...args);
  }

  action(message: string, ...args: any[]) {
    console.log(...this.formatMessage('action', message), ...args);
  }

  api(message: string, ...args: any[]) {
    console.log(...this.formatMessage('api', message), ...args);
  }
}

export const logger = new Logger();
