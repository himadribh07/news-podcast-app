/**
 * API Configuration
 * Centralized place to manage API URLs for both local and production environments
 */

const PRODUCTION_API = 'https://news-podcast-app.onrender.com';

// const LOCAL_API = 'http://localhost:8000';

// Use production by default
const API_BASE_URL = PRODUCTION_API;
// Uncomment below and comment above to switch to local development
// const API_BASE_URL = LOCAL_API;

export default API_BASE_URL;
