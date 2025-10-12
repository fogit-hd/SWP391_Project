import axios from "axios";

// Set config defaults when creating the instance
const api = axios.create({
  baseURL: "https://swp391backend-5.onrender.com/api",
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

// Response interceptor để xử lý 401 và refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshTokenValue = localStorage.getItem("refreshToken")?.replaceAll('"', "");
        if (!refreshTokenValue) {
          console.log("No refresh token found, redirecting to login");
          processQueue(new Error("No refresh token"), null);
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userData");
          window.location.href = '/login';
          return Promise.reject(new Error("No refresh token"));
        }

        console.log("Auto-refreshing token...");
        const response = await axios.post("https://swp391backend-5.onrender.com/api/auth/refresh-token", {
          refreshToken: refreshTokenValue
        });

        if (response.data && response.data.data) {
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          // Update tokens in localStorage
          console.log("Setting new authentication token");
          localStorage.setItem("token", accessToken);
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }

          console.log("Token auto-refreshed successfully");

          // Process queued requests
          processQueue(null, accessToken);

          // Retry original request
          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          throw new Error("Invalid refresh token response");
        }
      } catch (refreshError) {
        console.error("Auto-refresh token failed:", refreshError);
        processQueue(refreshError, null);

        // Clear tokens and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userData");

        console.log("Authentication tokens cleared");

        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
