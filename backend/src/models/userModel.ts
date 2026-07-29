export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

const users: User[] = [];

export function getUsers() {
  return users;
}

export function findUserByEmail(email: string) {
  return users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
}

export function addUser(user: User) {
  users.push(user);
}


