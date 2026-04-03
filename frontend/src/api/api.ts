import axios from 'axios';

// Actualizado con la nueva IP del Wi-Fi de hoy
export const api = axios.create({
  baseURL: 'http://172.25.154.246:3000',
});

