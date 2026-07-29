export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password?: string;
  provider: "local" | "google";
  googleId?: string;
  picture?: string;
  createdAt: string;
}

const users: User[] = [];

export function getUsers() {
  return users;
}

export function addUser(user: User) {
  users.push(user);
}

export function findUserByEmail(email: string) {
  return users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
}

export function findUserByUsername(username: string) {
  return users.find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
}

export function findUserByGoogleId(googleId: string) {
  return users.find(
    (user) => user.googleId === googleId
  );
}

