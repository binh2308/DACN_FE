import axios, { type AxiosResponse } from "axios";

export const request = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

request.interceptors.response.use(
  (res: AxiosResponse) => res.data,
  async (res: AxiosResponse) => {
    if (res.status === 401) {
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }
    if (res?.response?.data?.message) {
      res.message = res.response.data.message;
    }
    if (res?.response?.data?.code === "INVALID_BODY") {
      res.error = res.response.data.error;
    }
    throw res;
  }
);

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
