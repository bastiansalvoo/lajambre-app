import axios from 'axios';

// Actualizado con la nueva IP del Wi-Fi de hoy
export const api = axios.create({
  baseURL: 'http://192.168.1.14:3000',
});

