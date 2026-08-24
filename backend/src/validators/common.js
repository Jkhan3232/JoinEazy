const AppError = require("../utils/AppError");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uppercasePattern = /[A-Z]/;
const lowercasePattern = /[a-z]/;
const numberPattern = /\d/;
const symbolPattern = /[^A-Za-z0-9]/;

const ensureString = (value) => (typeof value === "string" ? value.trim() : "");

const isValidEmail = (email) => emailPattern.test(email);

const isStrongPassword = (password) =>
  password.length >= 8 &&
  uppercasePattern.test(password) &&
  lowercasePattern.test(password) &&
  numberPattern.test(password) &&
  symbolPattern.test(password);

const isValidUrl = (value) => {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (_error) {
    return false;
  }
};

const validateRequiredFields = (fields) => {
  const missingFields = fields.filter(({ value }) => !ensureString(value));

  if (missingFields.length) {
    throw new AppError(
      `Missing required fields: ${missingFields.map(({ label }) => label).join(", ")}`,
      400,
    );
  }
};

module.exports = {
  AppError,
  ensureString,
  isValidEmail,
  isStrongPassword,
  isValidUrl,
  validateRequiredFields,
};
