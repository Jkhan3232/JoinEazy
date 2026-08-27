import api from "./api";

export const assignmentService = {
  getAssignments: async () => {
    const response = await api.get("/assignments");
    return response.data.data;
  },
  getAssignment: async (assignmentId) => {
    const response = await api.get(`/assignments/${assignmentId}`);
    return response.data.data;
  },
  createAssignment: async (payload) => {
    const response = await api.post("/assignments", payload);
    return response.data.data;
  },
  updateAssignment: async (assignmentId, payload) => {
    const response = await api.put(`/assignments/${assignmentId}`, payload);
    return response.data.data;
  },
  deleteAssignment: async (assignmentId) => {
    const response = await api.delete(`/assignments/${assignmentId}`);
    return response.data.data;
  },
  assignToAllGroups: async (assignmentId) => {
    const response = await api.post(`/assignments/${assignmentId}/all-groups`);
    return response.data.data;
  },
  assignToSelectedGroups: async (assignmentId, payload) => {
    const response = await api.post(
      `/assignments/${assignmentId}/groups`,
      payload,
    );
    return response.data.data;
  },
  getStudentAssignments: async () => {
    const response = await api.get("/student/assignments");
    return response.data.data;
  },
  confirmSubmission: async (assignmentId) => {
    const response = await api.post(
      `/assignments/${assignmentId}/submit/confirm`,
    );
    return response.data.data;
  },
  submitAssignment: async (assignmentId) => {
    const response = await api.post(`/assignments/${assignmentId}/submit`);
    return response.data.data;
  },
  getSubmissionStatus: async (assignmentId, groupId = null) => {
    const response = await api.get(
      `/assignments/${assignmentId}/submission-status`,
      {
        params: groupId ? { groupId } : undefined,
      },
    );
    return response.data.data;
  },
  getSubmissions: async (assignmentId, status = "") => {
    const response = await api.get(`/assignments/${assignmentId}/submissions`, {
      params: status ? { status } : undefined,
    });
    return response.data.data;
  },
};
