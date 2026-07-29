export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  provider: "local" | "google";
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
