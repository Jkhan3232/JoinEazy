const {
  AppError,
  ensureString,
  isValidUrl,
  validateRequiredFields,
} = require("./common");

const normalizeAssignmentPayload = (payload) => {
  const title = ensureString(payload.title);
  const description = ensureString(payload.description);
  const dueDate = ensureString(payload.deadline || payload.dueDate);
  const oneDriveLink = ensureString(payload.oneDriveLink);
  const courseId = ensureString(payload.courseId);
  const submissionType = ensureString(
    payload.submissionType || "GROUP",
  ).toUpperCase();

  validateRequiredFields([
    { label: "title", value: title },
    { label: "description", value: description },
    { label: "due date", value: dueDate },
    { label: "OneDrive link", value: oneDriveLink },
    { label: "course", value: courseId },
  ]);

  if (!isValidUrl(oneDriveLink)) {
    throw new AppError("Please provide a valid OneDrive URL", 400);
  }

  const linkHost = new URL(oneDriveLink).hostname.toLowerCase();
  const isMicrosoftDriveLink =
    linkHost === "onedrive.live.com" ||
    linkHost === "1drv.ms" ||
    linkHost.endsWith(".sharepoint.com");
  if (!isMicrosoftDriveLink) {
    throw new AppError("Please provide a OneDrive or SharePoint URL", 400);
  }

  if (!["INDIVIDUAL", "GROUP"].includes(submissionType)) {
    throw new AppError("Submission type must be INDIVIDUAL or GROUP", 400);
  }

  const parsedDueDate = new Date(dueDate);

  if (Number.isNaN(parsedDueDate.getTime())) {
    throw new AppError("Please provide a valid due date", 400);
  }

  return {
    title,
    description,
    dueDate: parsedDueDate,
    deadline: parsedDueDate,
    oneDriveLink,
    submissionType,
    courseId,
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
