import type { ApiPayload, ApiResult } from "../types/api";

// See src/types/api.ts for why the API layer is declared rather than inferred.
declare const usersApi: {
  getAllUsers: () => ApiResult;
  getAdminUsers: () => ApiResult;
  getUserById: (user_id: number | string) => ApiResult;
  createUser: (data: ApiPayload) => ApiResult;
  updateUser: (user_id: number | string, data: ApiPayload) => ApiResult;
  deleteUser: (user_id: number | string) => ApiResult;
  updateInterview: (user_id: number | string, data: ApiPayload) => ApiResult;
};

export default usersApi;
