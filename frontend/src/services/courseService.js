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
};
