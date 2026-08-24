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
  if (status === "CONFIRMED" || status === "Completed") {
    return "success";
  }

  if (status === "In Progress") {
    return "warning";
  }

  return "neutral";
};

export const toPercentLabel = (value) => `${value || 0}%`;
