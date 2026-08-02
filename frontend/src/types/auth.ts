export interface User {
  id: string;

  fullName: string;

  username: string;

  email: string;

  role: string;

  status: string;

  provider: "local" | "google";

  picture: string | null;

  createdAt: string;
}

export interface AuthResponse {
  user: User;

  token: string;
}

