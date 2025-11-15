import { projectId, publicAnonKey } from './supabase/info';

// Base API URL - adjust based on your Supabase Edge Function configuration
// The Edge Function is deployed at /functions/v1/ and routes are prefixed with /make-server-c95fd11c
export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-c95fd11c`;

// Helper function to make API calls
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${publicAnonKey}`,
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}