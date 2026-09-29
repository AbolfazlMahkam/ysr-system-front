const TOKEN_KEY = "access-token";
const REFRESH_TOKEN_KEY = "refresh-token";
const USER_KEY = "UserInfo";

function notifySessionChange() {
  window.dispatchEvent(new CustomEvent("ysr:session-change"));
}

export default {
  getToken: () => {
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token) => {
    window.localStorage.setItem(TOKEN_KEY, token);
    notifySessionChange();
  },
  removeToken: () => {
    window.localStorage.removeItem(TOKEN_KEY);
    notifySessionChange();
  },
  getRefreshToken: () => {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setRefreshToken: (token) => {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
    notifySessionChange();
  },
  removeRefreshToken: () => {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    notifySessionChange();
  },
  getUserInfo: () => {
    return JSON.parse(window.localStorage.getItem(USER_KEY));
  },
  setUserInfo: (info) => {
    window.localStorage.setItem(USER_KEY, JSON.stringify(info));
  },
  removeUserInfo: () => {
    window.localStorage.removeItem(USER_KEY);
  },
  setSession: (accessToken, refreshToken) => {
    if (accessToken) {
      window.localStorage.setItem(TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    notifySessionChange();
  },
  clearSession: () => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    notifySessionChange();
  },
};
