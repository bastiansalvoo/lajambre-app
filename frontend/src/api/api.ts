import axios from 'axios';

// ⚙️ Cambiá esta IP cuando estés en otro Wi-Fi. En producción, usá el dominio real.
const API_HOST = '192.168.0.15';
const API_PORT = '3000';

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}`;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

