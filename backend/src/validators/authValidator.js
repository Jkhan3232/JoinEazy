const {
  AppError,
  ensureString,
  isStrongPassword,
  isValidEmail,
  validateRequiredFields,
} = require("./common");

const validateRegisterPayload = (payload) => {
  const name = ensureString(payload.name);
  const email = ensureString(payload.email).toLowerCase();
  const password = ensureString(payload.password);

  validateRequiredFields([
    { label: "name", value: name },
    { label: "email", value: email },
    { label: "password", value: password },
  ]);

  if (!isValidEmail(email)) {
    throw new AppError("Please provide a valid email address", 400);
  }

  if (!isStrongPassword(password)) {
    throw new AppError(
      "Password must be at least 8 characters and include upper, lower, number, and symbol",
      400,
    );
  }

  return { name, email, password };
};

const validateLoginPayload = (payload) => {
  const email = ensureString(payload.email).toLowerCase();
  const password = ensureString(payload.password);

  validateRequiredFields([
    { label: "email", value: email },
    { label: "password", value: password },
  ]);

  if (!isValidEmail(email)) {
    throw new AppError("Please provide a valid email address", 400);
  }

  return { email, password };
};

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
};
