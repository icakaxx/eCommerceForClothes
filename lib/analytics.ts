/**
 * Analytics Utility Functions
 * Provides device detection, browser parsing, OS detection, and visitor fingerprinting
 */

export interface DeviceInfo {
  type: string; // ios, android, macos, windows, linux, other
  name: string;
}

export interface BrowserInfo {
  name: string;
  version: string;
}

export interface OSInfo {
  name: string;
  version: string;
}

export interface VisitorData {
  visitorId: string;
  deviceType: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  referrer: string;
  referrerCategory: string;
  screenResolution: string;
  language: string;
  timezone: string;
}

/**
 * Get device type from user agent
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { type: 'other', name: 'Unknown' };
  }

  const ua = navigator.userAgent.toLowerCase();
  
  // iOS detection
  if (/iphone|ipad|ipod/.test(ua)) {
    return { type: 'ios', name: 'iOS Device' };
  }
  
  // Android detection
  if (/android/.test(ua)) {
    return { type: 'android', name: 'Android Device' };
  }
  
  // macOS detection
  if (/mac os x/.test(ua)) {
    return { type: 'macos', name: 'macOS' };
  }
  
  // Windows detection
  if (/windows nt/.test(ua)) {
    return { type: 'windows', name: 'Windows' };
  }
  
  // Linux detection
  if (/linux/.test(ua) && !/android/.test(ua)) {
    return { type: 'linux', name: 'Linux' };
  }
  
  return { type: 'other', name: 'Other' };
}

/**
 * Get browser information from user agent
 */
export function getBrowserInfo(): BrowserInfo {
  if (typeof window === 'undefined') {
    return { name: 'Unknown', version: '' };
  }

  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = '';

  // Edge (Chromium-based)
  if (ua.indexOf('Edg/') > -1) {
    name = 'Edge';
    version = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || '';
  }
  // Chrome
  else if (ua.indexOf('Chrome/') > -1 && ua.indexOf('Edg/') === -1) {
    name = 'Chrome';
    version = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || '';
  }
  // Safari
  else if (ua.indexOf('Safari/') > -1 && ua.indexOf('Chrome/') === -1) {
    name = 'Safari';
    version = ua.match(/Version\/(\d+\.\d+)/)?.[1] || '';
  }
  // Firefox
  else if (ua.indexOf('Firefox/') > -1) {
    name = 'Firefox';
    version = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || '';
  }
  // Opera
  else if (ua.indexOf('OPR/') > -1 || ua.indexOf('Opera/') > -1) {
    name = 'Opera';
    version = ua.match(/(?:OPR|Opera)\/(\d+\.\d+)/)?.[1] || '';
  }

  return { name, version };
}

/**
 * Get operating system information
 */
export function getOSInfo(): OSInfo {
  if (typeof window === 'undefined') {
    return { name: 'Unknown', version: '' };
  }

  const ua = navigator.userAgent;
  let name = 'Unknown';
  let version = '';

  // Windows
  if (ua.indexOf('Windows NT') > -1) {
    name = 'Windows';
    const match = ua.match(/Windows NT (\d+\.\d+)/);
    if (match) {
      const ntVersion = match[1];
      // Map NT versions to Windows versions
      const versionMap: Record<string, string> = {
        '10.0': '10/11',
        '6.3': '8.1',
        '6.2': '8',
        '6.1': '7',
      };
      version = versionMap[ntVersion] || ntVersion;
    }
  }
  // macOS
  else if (ua.indexOf('Mac OS X') > -1) {
    name = 'macOS';
    const match = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    if (match) {
      version = match[1].replace(/_/g, '.');
    }
  }
  // iOS
  else if (/iPhone|iPad|iPod/.test(ua)) {
    name = 'iOS';
    const match = ua.match(/OS (\d+[._]\d+[._]?\d*)/);
    if (match) {
      version = match[1].replace(/_/g, '.');
    }
  }
  // Android
  else if (ua.indexOf('Android') > -1) {
    name = 'Android';
    const match = ua.match(/Android (\d+\.\d+)/);
    if (match) {
      version = match[1];
    }
  }
  // Linux
  else if (ua.indexOf('Linux') > -1) {
    name = 'Linux';
  }

  return { name, version };
}

/**
 * Categorize referrer URL
 */
export function categorizeReferrer(referrer: string): string {
  if (!referrer || referrer === '') {
    return 'direct';
  }

  const url = referrer.toLowerCase();

  // Google
  if (url.includes('google.')) {
    return 'google';
  }

  // Facebook
  if (url.includes('facebook.') || url.includes('fb.')) {
    return 'facebook';
  }

  // Instagram
  if (url.includes('instagram.')) {
    return 'instagram';
  }

  // Twitter/X
  if (url.includes('twitter.') || url.includes('t.co')) {
    return 'twitter';
  }

  // LinkedIn
  if (url.includes('linkedin.')) {
    return 'linkedin';
  }

  // YouTube
  if (url.includes('youtube.') || url.includes('youtu.be')) {
    return 'youtube';
  }

  // Bing
  if (url.includes('bing.')) {
    return 'bing';
  }

  // Yahoo
  if (url.includes('yahoo.')) {
    return 'yahoo';
  }

  return 'other';
}

/**
 * Generate a hashed visitor ID from browser fingerprint
 * This creates a pseudo-anonymous identifier
 */
export async function generateVisitorId(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  // Collect fingerprint data
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown',
  ].join('|');

  // Hash the fingerprint
  const hash = await simpleHash(fingerprint);
  return hash;
}

/**
 * Simple hash function using SubtleCrypto API
 */
async function simpleHash(str: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback for environments without crypto
    return btoa(str).substring(0, 32);
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 32); // Use first 32 chars
}

/**
 * Get or create visitor ID from localStorage
 */
export async function getOrCreateVisitorId(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  const stored = localStorage.getItem('visitor_id');
  if (stored) {
    return stored;
  }

  const newId = await generateVisitorId();
  localStorage.setItem('visitor_id', newId);
  return newId;
}

/**
 * Collect all visitor data
 */
export async function collectVisitorData(): Promise<VisitorData> {
  const device = getDeviceInfo();
  const browser = getBrowserInfo();
  const os = getOSInfo();
  const visitorId = await getOrCreateVisitorId();
  const referrer = typeof document !== 'undefined' ? document.referrer : '';

  return {
    visitorId,
    deviceType: device.type,
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version,
    referrer,
    referrerCategory: categorizeReferrer(referrer),
    screenResolution: typeof window !== 'undefined' ? `${screen.width}x${screen.height}` : '',
    language: typeof navigator !== 'undefined' ? navigator.language : '',
    timezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
  };
}

/**
 * Check if the user agent is a bot
 */
export function isBot(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const botPatterns = [
    /bot/i,
    /spider/i,
    /crawl/i,
    /headless/i,
    /phantom/i,
    /slurp/i,
    /scrape/i,
  ];

  return botPatterns.some(pattern => pattern.test(navigator.userAgent));
}

