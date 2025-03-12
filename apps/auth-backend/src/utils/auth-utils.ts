// Third-party imports
import argon2 from "argon2";

export const hashPassword = async (password: string) => {
  try {
    const hash = await argon2.hash(password);
    return hash;
  } catch (err) {
    throw Error("Unable to hash password");
  }
};
