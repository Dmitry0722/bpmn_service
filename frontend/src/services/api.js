import axios from 'axios';

// Базовый URL API (меняй только если бэкенд на другом порту)
const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const uploadFile = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/generate/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data; // { task_id: "..." }
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Ошибка сервера');
    } else if (error.request) {
      throw new Error('Нет ответа от сервера');
    } else {
      throw new Error('Ошибка при отправке запроса');
    }
  }
};

export const checkStatus = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/status/`);
  return response.data;
};

export const getResults = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/result/`);
  return response.data;
};

export default api;