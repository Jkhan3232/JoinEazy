const { AppError, ensureString, isValidEmail, validateRequiredFields } = require("./common");

const validateCreateGroupPayload = (payload) => {
  const name = ensureString(payload.name);
  const courseId = ensureString(payload.courseId);

  validateRequiredFields([
    { label: "group name", value: name },
    { label: "course", value: courseId },
  ]);

  return { name, courseId };
};

const validateAddMemberPayload = (payload) => {
  const identifier = ensureString(payload.identifier || payload.email || payload.studentId);

  validateRequiredFields([{ label: "email or student ID", value: identifier }]);

  const mode = isValidEmail(identifier) ? "email" : "id";

  if (mode === "id" && identifier.length < 6) {
    throw new AppError("Please provide a valid email or student ID", 400);
  }

  return {
    identifier: mode === "email" ? identifier.toLowerCase() : identifier,
    mode,
  };
};

module.exports = {
  validateCreateGroupPayload,
  validateAddMemberPayload,
};
