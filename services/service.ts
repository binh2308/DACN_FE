import axios, { type AxiosResponse, AxiosError } from "axios";

export const request = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ENDPOINT,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// request.interceptors.response.use(
//   (res: AxiosResponse) => res.data,
//   async (res: AxiosResponse) => {
//     if (res.status === 401) {
//       window.location.href = "/login";
//       throw new Error("Unauthorized");
//     }
//     if (res?.response?.data?.message) {
//       res.message = res.response.data.message;
//     }
//     if (res?.response?.data?.code === "INVALID_BODY") {
//       res.error = res.response.data.error;
//     }
//     throw res;
//   }
// );

request.interceptors.response.use(
  (res: AxiosResponse) => res.data,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
      return Promise.reject(new Error("Unauthorized"));
    }

    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    if (error.response?.data?.code === "INVALID_BODY") {
      (error as any).error = error.response.data.error;
    }

    return Promise.reject(error);
  }
);

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers)
      config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
