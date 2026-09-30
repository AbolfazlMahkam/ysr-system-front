import type { ApiPayload, ApiResult } from "../types/api";

// See src/types/api.ts for why the API layer is declared rather than inferred.
declare const authApi: {
  register: (data: ApiPayload) => ApiResult;
  login: (data: ApiPayload) => ApiResult;
  loginByOtp: (data: ApiPayload) => ApiResult;
  loginWithGoogle: (credential: unknown) => ApiResult;
  refresh: (refresh_token: string) => ApiResult;
  logout: (refresh_token: string) => ApiResult;
  getProfile: () => ApiResult;
  loginAsUser: (userId: number | string) => ApiResult;
};

export default authApi;
