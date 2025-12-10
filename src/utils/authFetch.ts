// Global flag to prevent multiple simultaneous logouts
let isLoggingOut = false;

interface FetchOptions extends RequestInit {
  skipAuthCheck?: boolean; // Flag to skip 401 handling for specific requests
}

/**
 * Get Firebase ID token from current user
 * Returns null if no user is authenticated
 */
async function getFirebaseToken(): Promise<string | null> {
  try {
    // Get current user from localStorage
    const currentUserStr = localStorage.getItem('currentUser');
    console.log('[getFirebaseToken] Raw localStorage value:', currentUserStr);
    
    if (!currentUserStr) {
      console.log('[getFirebaseToken] No user in localStorage');
      return null;
    }

    const currentUser = JSON.parse(currentUserStr);
    console.log('[getFirebaseToken] Parsed currentUser:', currentUser);
    console.log('[getFirebaseToken] Token value:', currentUser.token);
    
    // Check if we have a token stored
    if (currentUser.token) {
      console.log('[getFirebaseToken] Token found in localStorage');
      return currentUser.token;
    }

    console.log('[getFirebaseToken] No token found in currentUser object');
    return null;
  } catch (error) {
    console.error('[getFirebaseToken] Error getting token:', error);
    return null;
  }
}

/**
 * Custom fetch wrapper that handles 401 errors globally
 * Automatically adds Firebase Bearer token to authenticated requests
 * Automatically logs out user and redirects to login page on token expiration
 */
export async function authFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const { skipAuthCheck = false, ...fetchOptions } = options;

  // Add debug logging
  console.log('[authFetch] Request to:', url);
  console.log('[authFetch] skipAuthCheck:', skipAuthCheck);

  // Get Firebase token and add to headers if not skipping auth
  if (!skipAuthCheck) {
    const token = await getFirebaseToken();
    
    if (token) {
      console.log('[authFetch] Adding Bearer token to headers');
      console.log('[authFetch] Token length:', token.length);
      
      // Merge headers with Authorization
      const headers = new Headers(fetchOptions.headers);
      headers.set('Authorization', `Bearer ${token}`);
      
      fetchOptions.headers = headers;
      
      // Log the final headers
      console.log('[authFetch] Final headers:', Object.fromEntries(headers.entries()));
    } else {
      console.warn('[authFetch] No token available for authenticated request');
    }
  }

  try {
    const response = await fetch(url, fetchOptions);

    console.log('[authFetch] Response status:', response.status);

    // Check for 401 Unauthorized error
    if (response.status === 401 && !skipAuthCheck && !isLoggingOut) {
      console.log('[authFetch] 401 detected, triggering logout...');
      await handleUnauthorized();
    }

    return response;
  } catch (error) {
    console.error('[authFetch] Network error:', error);
    // Re-throw network errors
    throw error;
  }
}

/**
 * Handles unauthorized access (401 errors)
 * Logs out user, cleans storage, and redirects to login
 */
async function handleUnauthorized(): Promise<void> {
  // Prevent multiple simultaneous logout attempts
  if (isLoggingOut) {
    console.log('[handleUnauthorized] Already logging out, skipping...');
    return;
  }

  console.log('[handleUnauthorized] Starting logout process...');
  isLoggingOut = true;

  try {
    // Clean local storage
    localStorage.removeItem('currentUser');
    console.log('[handleUnauthorized] Cleared localStorage');
    
    // Optional: Sign out from Firebase if needed
    // import { getAuth, signOut } from 'firebase/auth';
    // const auth = getAuth();
    // await signOut(auth);

    // Store session expiry message for display after redirect
    sessionStorage.setItem('sessionExpired', 'true');
    console.log('[handleUnauthorized] Set sessionExpired flag');

    // Redirect to home page (login modal will open automatically)
    console.log('[handleUnauthorized] Redirecting to home page...');
    window.location.href = '/';
  } catch (error) {
    console.error('[handleUnauthorized] Error during logout:', error);
    // Force redirect even if logout fails
    window.location.href = '/';
  } finally {
    // Reset flag after a delay to allow redirect
    setTimeout(() => {
      isLoggingOut = false;
      console.log('[handleUnauthorized] Reset isLoggingOut flag');
    }, 1000);
  }
}

/**
 * Check if session has expired and return the flag
 * Should be called on app initialization
 */
export function checkSessionExpired(): boolean {
  const expired = sessionStorage.getItem('sessionExpired') === 'true';
  if (expired) {
    sessionStorage.removeItem('sessionExpired');
    console.log('[checkSessionExpired] Session expired flag detected and cleared');
  }
  return expired;
}
