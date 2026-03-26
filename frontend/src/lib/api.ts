import axios from "axios";

const BACKEND_URL = "http://localhost:5000"

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
}

const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true
});

type FailedRequest = {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
};

// csrf token part
let isRefreshingCSRFToken = false;
let csrfFailedQueue: FailedRequest[] = [];

const processCSRFQueue = (error: any, token: any = null) => {
  csrfFailedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  csrfFailedQueue = [];
}

api.interceptors.request.use((config)=>{
  if (config.method === 'post' || config.method === 'put' || config.method === 'delete') {
    const csrfToken = getCookie("csrfToken");
    if (csrfToken) {
      config.headers["x-csrf-token"] = csrfToken;
    }
  }
  return config;
}, (error)=> Promise.reject(error));

// Access token refreshing part
let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: any, token: any = null) => {
  failedQueue.forEach((prom)=>{
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// Common part
api.interceptors.response.use(
  (response)=> response,
  async(error)=>{
    const originalRequest = error.config;

    if (error.response?.status === 403 && !originalRequest._retry) {
      const errorCode = error.response?.data?.code || "";

      if (errorCode.startsWith("CSRF_")) {
        if (isRefreshingCSRFToken) {
          return new Promise((resolve, reject)=>{
            csrfFailedQueue.push({resolve, reject});
          }).then(()=>{
            api.request(originalRequest);
          })
        }

        isRefreshingCSRFToken = true;
        originalRequest._retry = true;

        try {
          await api.post("/api/v1/refresh-csrf");
          processCSRFQueue(null);
          return api.request(originalRequest);
        } catch(error: any) {
          processCSRFQueue(error);
          console.error("Failed to refresh csrf token\n", error);
          return Promise.reject(error);
        } finally {
          isRefreshingCSRFToken = false;
        }
      }

      if (isRefreshing) {
        return new Promise((resolve, reject)=>{
          failedQueue.push({resolve, reject})
        }).then(()=>{
          return api.request(originalRequest)
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/api/v1/refresh");
        processQueue(null);
        return api.request(originalRequest);
      } catch(error) {
        processQueue(error, null);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;