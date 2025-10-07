import axios from "axios";

// Set config defaults when creating the instance
const api = axios.create({
  baseURL: "http://14.225.212.245:8080/api/",
});

// Thêm token trước khi gửi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")?.replaceAll('"', "");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

export default api;
