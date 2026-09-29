import HttpClient from "../utiles/axios";

function uploadFile(file, accept, maxSize) {
  const formData = new FormData();
  formData.append("file", file);
  const params = {};
  if (accept) params.accept = accept;
  if (maxSize) params.maxSize = String(maxSize);
  return HttpClient.post("/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    params,
  });
}

export default {
  getActiveSchemas: () => HttpClient.get("/forms/schemas"),
  getSchemaBySlug: (slug) => HttpClient.get(`/forms/schemas/${slug}`),
  submitForm: (formSlug, answers) =>
    HttpClient.post(`/forms/${formSlug}/submit`, { answers }),
  getMySubmissions: (formSlug) =>
    HttpClient.get(`/forms/${formSlug}/submissions`),
  getMyAllSubmissions: () => HttpClient.get("/forms/my-submissions"),
  submitSelfDeclaration: (data) =>
    HttpClient.post("/forms/self-declaration", { data }),
  getMySelfDeclaration: () => HttpClient.get("/forms/self-declaration"),
  uploadFile,
};
