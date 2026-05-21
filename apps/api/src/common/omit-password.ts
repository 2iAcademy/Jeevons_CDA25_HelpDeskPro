// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function omitPassword<T extends { password: string }>(user: T): Omit<T, 'password'> {
  const { password, ...safeUser } = user;
  return safeUser;
}
