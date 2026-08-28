const {
  ensureString,
  validateRequiredFields,
} = require("./common");

const validateCoursePayload = (payload) => {
  const name = ensureString(payload.name);
  const code = ensureString(payload.code);
  const description = ensureString(payload.description);

  validateRequiredFields([
    { label: "course name", value: name },
    { label: "course code", value: code },
    { label: "description", value: description },
  ]);

  return {
    name,
    code,
    description,
  };
};

module.exports = {
  validateCoursePayload,
};
