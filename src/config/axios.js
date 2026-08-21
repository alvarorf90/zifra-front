import axios from "axios";
import { API_BASE_URL, getValidateUrl } from "./apiConfig";
import { clearSessionStorage, saveTokenFromHeaders } from "../utils/session";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
});

const redirectToLogin = () => {
  clearSessionStorage();
  window.location.href = "/login";
};

const tryValidateToken = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }

  try {
    const { data } = await axios.get(getValidateUrl(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (data?.accessToken) {
      localStorage.setItem("token", data.accessToken);
      return data.accessToken;
    }

    return token;
  } catch {
    return null;
  }
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    saveTokenFromHeaders(response.headers);
    return response;
  },
  async (error) => {
    if (!error.response) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    if (
      error.response.status === 401 &&
      originalRequest.url?.includes("/auth/login")
    ) {
      return Promise.reject(error);
    }

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await tryValidateToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    if (error.response.status === 401) {
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;
