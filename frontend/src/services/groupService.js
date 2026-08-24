import api from "./api";

export const groupService = {
  getGroups: async () => {
    const response = await api.get("/groups");
    return response.data.data;
  },
  getGroup: async (groupId) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data.data;
  },
  createGroup: async (payload) => {
    const response = await api.post("/groups", payload);
    return response.data.data;
  },
  addMember: async (groupId, payload) => {
    const response = await api.post(`/groups/${groupId}/members`, payload);
    return response.data.data;
  },
  removeMember: async (groupId, studentId) => {
    const response = await api.delete(`/groups/${groupId}/members/${studentId}`);
    return response.data.data;
  },
};
