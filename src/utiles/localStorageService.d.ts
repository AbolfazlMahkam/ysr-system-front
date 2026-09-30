// See src/types/api.ts for the context on the untyped JS layer.
declare const localStorageService: {
  getToken: () => string | null;
  setToken: (token: string) => void;
  removeToken: () => void;
  getRefreshToken: () => string | null;
  setRefreshToken: (token: string) => void;
  removeRefreshToken: () => void;
  // Mirrors JSON.parse, which is what the implementation calls.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getUserInfo: () => any;
  setUserInfo: (info: unknown) => void;
  removeUserInfo: () => void;
  setSession: (accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
};

export default localStorageService;
