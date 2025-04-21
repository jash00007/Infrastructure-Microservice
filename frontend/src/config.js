const useBore = process.env.REACT_APP_USE_BORE === 'true';

const config = {
  CREATE_LAB_URL: useBore 
    ? process.env.REACT_APP_BORE_CREATE_LAB_URL.replace('https:', 'http:')
    : 'http://localhost:3001',
  DELETE_LAB_URL: useBore 
    ? process.env.REACT_APP_BORE_DELETE_LAB_URL.replace('https:', 'http:')
    : 'http://localhost:3002',
  MONITOR_URL: useBore 
    ? process.env.REACT_APP_BORE_MONITOR_URL.replace('https:', 'http:')
    : 'http://localhost:3003',
  PERFORMANCE_URL: useBore 
    ? process.env.REACT_APP_BORE_PERFORMANCE_URL.replace('https:', 'http:')
    : 'http://localhost:3004',
  RESOURCE_URL: useBore 
    ? process.env.REACT_APP_BORE_RESOURCE_URL.replace('https:', 'http:')
    : 'http://localhost:3005',
  BACKUP_URL: useBore 
    ? process.env.REACT_APP_BORE_BACKUP_URL.replace('https:', 'http:')
    : 'http://localhost:3006',
  CALENDAR_URL: useBore
    ? process.env.REACT_APP_BORE_CALENDAR_URL.replace('https:', 'http:')
    : 'http://localhost:5000',
  AUTH_URL: useBore
    ? process.env.REACT_APP_BORE_AUTH_URL.replace('https:', 'http:')
    : 'http://localhost:3009'
};

export default config;
