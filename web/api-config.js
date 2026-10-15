window.__API_BASE__ = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api'
  : 'https://market-isufi-api.onrender.com/api';
