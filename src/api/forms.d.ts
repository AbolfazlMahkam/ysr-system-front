import type { ApiPayload, ApiResult } from "../types/api";

// See src/types/api.ts for why the API layer is declared rather than inferred.
declare const formsApi: {
  getActiveSchemas: () => ApiResult;
  getSchemaBySlug: (slug: string) => ApiResult;
  submitForm: (formSlug: string, answers: ApiPayload) => ApiResult;
  getMySubmissions: (formSlug: string) => ApiResult;
  getMyAllSubmissions: () => ApiResult;
  submitSelfDeclaration: (data: ApiPayload) => ApiResult;
  getMySelfDeclaration: () => ApiResult;
  uploadFile: (
    file: File,
    accept?: string,
    maxSize?: number,
  ) => ApiResult<{ url?: string }>;
};

export default formsApi;
