import HttpClient from "../utiles/axios";

export default {
  // Years
  getYears: () => HttpClient.get("/arbaeen/years"),
  createYear: (data) => HttpClient.post("/arbaeen/years", data),
  deleteYear: (id) => HttpClient.delete(`/arbaeen/years/${id}`),

  // Processions by year
  getProcessionsByYear: (yearId) =>
    HttpClient.get(`/arbaeen/years/${yearId}/processions`),

  // Processions CRUD
  getProcession: (id) => HttpClient.get(`/arbaeen/processions/${id}`),
  createProcession: (data) => HttpClient.post("/arbaeen/processions", data),
  updateProcession: (id, data) =>
    HttpClient.put(`/arbaeen/processions/${id}`, data),
  deleteProcession: (id) => HttpClient.delete(`/arbaeen/processions/${id}`),
  setResponsibleConsultant: (processionId, data) =>
    HttpClient.put(
      `/arbaeen/processions/${processionId}/responsible-consultant`,
      data,
    ),

  // Consultants
  getProcessionConsultants: (id) =>
    HttpClient.get(`/arbaeen/processions/${id}/consultants`),
  assignConsultant: (processionId, data) =>
    HttpClient.post(`/arbaeen/processions/${processionId}/consultants`, data),
  assignConsultantsBatch: (processionId, data) =>
    HttpClient.post(
      `/arbaeen/processions/${processionId}/consultants/batch`,
      data,
    ),
  removeConsultant: (processionId, userId) =>
    HttpClient.delete(
      `/arbaeen/processions/${processionId}/consultants/${userId}`,
    ),
  getAvailableConsultants: (gender) =>
    HttpClient.get("/arbaeen/available-consultants", {
      params: gender ? { gender } : {},
    }),
  getMyProcessions: () => HttpClient.get("/arbaeen/my-processions"),
  toggleShowOnDashboard: (yearId) =>
    HttpClient.put(`/arbaeen/years/${yearId}/toggle-show-on-dashboard`),
};
