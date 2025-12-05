// src/config.ts
const isProduction = import.meta.env.MODE === 'production';

export const API_BASE_URL = isProduction 
  ? "https://document-simplifier.onrender.com"
  : "http://localhost:5000";