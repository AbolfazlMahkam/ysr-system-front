import HttpClient from "../utiles/axios";

export default {
  register: (data) => HttpClient.post("auth/register", data),
  login: (data) => HttpClient.post("auth/login", data),
  loginByOtp: (data) => HttpClient.post("auth/login_otp", data),
  loginWithGoogle: (credential) => HttpClient.post("auth/google", { credential }),
  refresh: (refresh_token) => HttpClient.post("auth/refresh", { refresh_token }),
  logout: (refresh_token) => HttpClient.post("auth/logout", { refresh_token }),
  getProfile: () => HttpClient.get("auth/me"),
  loginAsUser: (userId) => HttpClient.post(`auth/login-as/${userId}`),
};
