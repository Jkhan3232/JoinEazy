import api from "./api";

export const courseService = {
  getCourses: async () => {
    const response = await api.get("/courses");
    return response.data.data;
  },
  getCourse: async (courseId) => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data.data;
  },
  getCourseAssignments: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/assignments`);
    return response.data.data;
  },
  createCourse: async (payload) => {
    const response = await api.post("/courses", payload);
    return response.data.data;
  },
  updateCourse: async (courseId, payload) => {
    const response = await api.put(`/courses/${courseId}`, payload);
    return response.data.data;
  },
  deleteCourse: async (courseId) => {
    const response = await api.delete(`/courses/${courseId}`);
    return response.data.data;
  },
};
