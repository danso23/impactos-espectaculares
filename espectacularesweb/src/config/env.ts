export const env = {
  apiUrl: import.meta.env.VITE_API_URL,
  appEnv: import.meta.env.VITE_APP_ENV,
  inactivityTimeoutMinutes: import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES ?? "30",
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
};
