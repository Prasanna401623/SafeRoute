// Check if we're running in a mobile environment
const isMobile = typeof window !== 'undefined' && window.navigator && window.navigator.product === 'ReactNative';

// Use localhost for development on laptop, IP for mobile
export const API_BASE_URL = 'http://10.255.114.26:8000/api';

// This will be used on laptop 