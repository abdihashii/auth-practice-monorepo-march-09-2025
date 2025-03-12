export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
  allowedSymbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
} as const;
