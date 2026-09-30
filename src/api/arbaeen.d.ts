import type { ApiPayload, ApiResult } from "../types/api";

// See src/types/api.ts for why the API layer is declared rather than inferred.
declare const arbaeenApi: {
  // Years
  getYears: () => ApiResult;
  createYear: (data: ApiPayload) => ApiResult;
  deleteYear: (id: number | string) => ApiResult;

  // Processions by year
  getProcessionsByYear: (yearId: number | string) => ApiResult;

  // Processions CRUD
  getProcession: (id: number | string) => ApiResult;
  createProcession: (data: ApiPayload) => ApiResult;
  updateProcession: (id: number | string, data: ApiPayload) => ApiResult;
  deleteProcession: (id: number | string) => ApiResult;
  setResponsibleConsultant: (
    processionId: number | string,
    data: ApiPayload,
  ) => ApiResult;

  // Consultants
  getProcessionConsultants: (id: number | string) => ApiResult;
  assignConsultant: (
    processionId: number | string,
    data: ApiPayload,
  ) => ApiResult;
  assignConsultantsBatch: (
    processionId: number | string,
    data: ApiPayload,
  ) => ApiResult;
  removeConsultant: (
    processionId: number | string,
    userId: number | string,
  ) => ApiResult;
  getAvailableConsultants: (gender?: string) => ApiResult;
  getMyProcessions: () => ApiResult;
  toggleShowOnDashboard: (yearId: number | string) => ApiResult;
};

export default arbaeenApi;
