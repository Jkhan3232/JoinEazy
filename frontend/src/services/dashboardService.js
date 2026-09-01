import api from "./api";

export const dashboardService = {
  getStudentDashboard: async () => {
    const response = await api.get("/student/dashboard");
    return response.data.data;
  },
  getStudentCourses: async () => {
    const response = await api.get("/student/courses");
    return response.data.data;
  },
  getStudentCourse: async (courseId) => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data.data;
  },
  getProfessorDashboard: async () => {
    const response = await api.get("/professor/dashboard");
    return response.data.data;
  },
  getAdminDashboard: async () => {
    const response = await api.get("/admin/dashboard");
    return response.data.data;
  },
  getProfessorCourses: async () => {
    const response = await api.get("/courses");
    return response.data.data;
  },
  getAdminCourses: async () => {
    const response = await api.get("/courses");
    return response.data.data;
  },
  getProfessorAnalytics: async () => {
    const response = await api.get("/professor/analytics");
    return response.data.data;
  },
  getAdminAnalytics: async () => {
    const response = await api.get("/admin/analytics");
    return response.data.data;
  },
  getProfessorGroups: async () => {
    const response = await api.get("/professor/groups");
    return response.data.data;
  },
  getAdminGroups: async () => {
    const response = await api.get("/admin/groups");
    return response.data.data;
  },
  getProfessorStudents: async () => {
    const response = await api.get("/professor/students");
    return response.data.data;
  },
  getAdminStudents: async () => {
    const response = await api.get("/admin/students");
    return response.data.data;
  },
};
