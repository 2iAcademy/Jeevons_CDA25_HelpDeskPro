export function omitPassword<T extends { password: string }>(user: T): Omit<T, 'password'> {
  const { password: _password, ...safeUser } = user;
  void _password;
  return safeUser;
}
