const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const clientLogger = {
  error: (message: any, context: Record<string, any> = {}): void => {
    console.error(`[CLIENT ERROR] ${message}`, context);
    sendToServer('error', message, context);
  },
  warn: (message: any, context: Record<string, any> = {}): void => {
    console.warn(`[CLIENT WARN] ${message}`, context);
    sendToServer('warn', message, context);
  },
  info: (message: any, context: Record<string, any> = {}): void => {
    console.log(`[CLIENT INFO] ${message}`, context);
  },
};

const sendToServer = (level: string, message: any, context: Record<string, any>): void => {
  try {
    const payload = {
      level,
      message: typeof message === 'string' ? message : message?.message || 'Error en cliente',
      stack: message?.stack || context?.error?.stack,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    fetch(`${API_BASE_URL}/api/logs/client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Ignorar errores de red para evitar bucles
    });
  } catch {
    // Fail silently
  }
};

export const initGlobalErrorTracking = (): void => {
  window.addEventListener('error', (event: ErrorEvent) => {
    clientLogger.error(event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    clientLogger.error(`Unhandled Promise Rejection: ${event.reason?.message || event.reason}`, {
      reason: event.reason,
    });
  });
};
