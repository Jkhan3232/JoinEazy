import api from "./api";

export const dashboardService = {
  getStudentDashboard: async () => {
    const response = await api.get("/student/dashboard");
    return response.data.data;
  },
  getAdminDashboard: async () => {
    const response = await api.get("/admin/dashboard");
    return response.data.data;
  },
  getAdminAnalytics: async () => {
    const response = await api.get("/admin/analytics");
    return response.data.data;
  },
  getAdminGroups: async () => {
    const response = await api.get("/admin/groups");
    return response.data.data;
  },
  getAdminStudents: async () => {
    const response = await api.get("/admin/students");
    return response.data.data;
  },
};
