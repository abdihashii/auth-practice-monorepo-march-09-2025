export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  data: {
    user: User;
    accessToken: string;
  };
}
