import { authFetch } from '../utils/authFetch';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://souplike-marjorie-fierily.ngrok-free.dev';

export const API_ENDPOINTS = {
  INSERT_CARD: `${API_BASE_URL}/webhook/InsertCard`,
  GET_CARDS: `${API_BASE_URL}/webhook/GetCards`,
  UPDATE_CARD: `${API_BASE_URL}/webhook/UpdateCard`,
  INSERT_MESSAGE: `${API_BASE_URL}/webhook/InsertMessage`,
  READ_MESSAGES: `${API_BASE_URL}/webhook/ReadMessages`,
  DELETE_MESSAGE: `${API_BASE_URL}/webhook/DeleteMessage`,
  GET_USER: `${API_BASE_URL}/webhook/GetUser`,
  GET_USERS_INFORMATION: `${API_BASE_URL}/webhook/GetUserInformation`,
  INSERT_USER: `${API_BASE_URL}/webhook/InsertUser`,
  UPDATE_USER: `${API_BASE_URL}/webhook/UpdateUser`,
  INSERT_ULINK_CARD: `${API_BASE_URL}/webhook/InsertUlinkCard`,
  GET_CARDS_BY_USER: `${API_BASE_URL}/webhook/GetCardsByUser`,
  GET_USERS_BY_CARD: `${API_BASE_URL}/webhook/GetUsersByCard`,
  UPDATE_ULINK_CARD: `${API_BASE_URL}/webhook/UpdateUlinkCard`,
  DELETE_ULINK_CARD: `${API_BASE_URL}/webhook/DeleteUlinkCard`,
  CREATE_CONTENT: `${API_BASE_URL}/webhook/create_content`,
  SEND_EMAIL: `${API_BASE_URL}/webhook/SendEmail`,
};

/**
 * Wrapper for API calls with automatic 401 handling
 * Use this instead of fetch() for all API requests
 */
export async function apiCall(endpoint: string, options: RequestInit = {}): Promise<Response> {
  return authFetch(endpoint, options);
}

/**
 * Helper for API calls that should skip 401 handling
 * Use for login/register endpoints
 */
export async function apiCallNoAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  return authFetch(endpoint, { ...options, skipAuthCheck: true });
}
