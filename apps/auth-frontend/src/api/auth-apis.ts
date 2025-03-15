import { BASE_API_URL } from "@/constants";

export const login = async (email: string, password: string) => {
  try {
    const res = await fetch(`${BASE_API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("Failed to login");
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
