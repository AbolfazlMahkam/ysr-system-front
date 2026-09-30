import type { ApiPayload, ApiResult } from "../types/api";

// See src/types/api.ts for why the API layer is declared rather than inferred.
declare const adminFormsApi: {
  getAll: () => ApiResult;
  getOne: (id: number | string) => ApiResult;
  create: (data: ApiPayload) => ApiResult;
  update: (id: number | string, data: ApiPayload) => ApiResult;
  remove: (id: number | string) => ApiResult;
  getSubmissions: (formId: number | string) => ApiResult;
  getSelfDeclarations: () => ApiResult;
  getSelfDeclaration: (id: number | string) => ApiResult;
  reviewSelfDeclaration: (id: number | string, data: ApiPayload) => ApiResult;
  getDashboardStats: () => ApiResult;
  getStatistics: (formId: number | string) => ApiResult;
  getParticipation: () => ApiResult;
};

export default adminFormsApi;
