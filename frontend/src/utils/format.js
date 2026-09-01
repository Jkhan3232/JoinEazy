export const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

export const formatDateTime = (value) => {
  if (!value) {
    return "Not confirmed yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

export const getErrorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

export const getStatusTone = (status) => {
  if (["ACKNOWLEDGED", "CONFIRMED", "Completed", "Completed!"].includes(status)) {
    return "success";
  }

  if (status === "SUBMITTED" || status === "In Progress") {
    return "info";
  }

  if (status === "PENDING" || status === "Pending") {
    return "warning";
  }

  return "neutral";
};

export const formatStatusLabel = (status) => {
  if (!status) {
    return "Pending";
  }

  const normalized = String(status).toUpperCase();

  if (normalized === "ACKNOWLEDGED") {
    return "Acknowledged";
  }

  if (normalized === "SUBMITTED") {
    return "Submitted";
  }

  if (normalized === "CONFIRMED") {
    return "Confirmed";
  }

  if (normalized === "PENDING") {
    return "Pending";
  }

  return status;
};

export const normalizeRole = (role) => {
  if (!role) {
    return role;
  }

  if (role === "ADMIN") {
    return "PROFESSOR";
  }

  return role;
};

export const formatRoleLabel = (role) => {
  if (normalizeRole(role) === "PROFESSOR") {
    return "Professor";
  }

  return "Student";
};

export const toPercentLabel = (value) => `${value || 0}%`;
