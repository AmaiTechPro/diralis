export interface User {
  id: string;

  fullName: string;

  username: string;

  email: string;

  password: string;

  provider: "local" | "google";

  createdAt: Date;
}

const users: User[] = [];

export function getUsers() {
  return users;
}

export function findUserByEmail(email: string) {
  return users.find(
    (user) =>
      user.email.toLowerCase() === email.toLowerCase()
  );
}

export function findUserByUsername(username: string) {
  return users.find(
    (user) =>
      user.username.toLowerCase() ===
      username.toLowerCase()
  );
}

export function findUserByIdentifier(
  identifier: string
) {
  const value = identifier.toLowerCase();

  return users.find(
    (user) =>
      user.email.toLowerCase() === value ||
      user.username.toLowerCase() === value
  );
}

export function addUser(user: User) {
  users.push(user);
}

