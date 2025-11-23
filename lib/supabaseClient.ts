
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qkimqxkskyzacosejrew.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFraW1xeGtza3l6YWNvc2VqcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDYyNDMsImV4cCI6MjA3OTQyMjI0M30.tFcI06JyFw5NNZNL2rYXWEXG1l_08l-ZRaH_yH7kP3Q';

// Determine the base domain for cookies to allow sharing session across subdomains
// e.g., if on 'dashboard.caroumate.com', cookie domain should be '.caroumate.com'
const getCookieDomain = () => {
  if (typeof window === 'undefined') return undefined;
  const hostname = window.location.hostname;
  
  // Don't set domain for localhost (browsers handle localhost differently)
  if (hostname.includes('localhost') || hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
    return undefined;
  }

  const parts = hostname.split('.');
  // If we have a subdomain (e.g., dashboard.example.com), use the root domain (.example.com)
  if (parts.length > 2) {
    return `.${parts.slice(-2).join('.')}`;
  }
  
  return `.${hostname}`;
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.localStorage,
    // Critical for sharing auth between dashboard.site.com and generator.site.com
    // Note: This requires both sites to be on the same base domain and protocol (https)
    cookieOptions: {
      domain: getCookieDomain(),
      path: '/',
      sameSite: 'lax',
      secure: true,
    }
  }
});
