export const API_BASE_URL =
  (import.meta as ImportMeta & { env: { PROD: boolean } }).env.PROD
    ? '/api'
    : 'http://localhost:5000/api';

export const THEME_STORAGE_KEY = 'kodxcamp-theme';
export const AUTH_TOKEN_KEY = 'kodxcamp-token';