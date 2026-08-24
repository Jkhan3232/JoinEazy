const {
  AppError,
  ensureString,
  isValidUrl,
  validateRequiredFields,
} = require("./common");

const normalizeAssignmentPayload = (payload) => {
  const title = ensureString(payload.title);
  const description = ensureString(payload.description);
  const dueDate = ensureString(payload.dueDate);
  const oneDriveLink = ensureString(payload.oneDriveLink);

  validateRequiredFields([
    { label: "title", value: title },
    { label: "description", value: description },
    { label: "due date", value: dueDate },
    { label: "OneDrive link", value: oneDriveLink },
  ]);

  if (!isValidUrl(oneDriveLink)) {
    throw new AppError("Please provide a valid OneDrive URL", 400);
  }

  const parsedDueDate = new Date(dueDate);

  if (Number.isNaN(parsedDueDate.getTime())) {
    throw new AppError("Please provide a valid due date", 400);
  }

  return {
    title,
    description,
    dueDate: parsedDueDate,
    oneDriveLink,
  };
};

const validateGroupIdsPayload = (payload) => {
  const groupIds = Array.isArray(payload.groupIds) ? payload.groupIds.filter(Boolean) : [];

  if (!groupIds.length) {
    throw new AppError("Please provide at least one group ID", 400);
  }

  return groupIds;
};

module.exports = {
  normalizeAssignmentPayload,
  validateGroupIdsPayload,
};
