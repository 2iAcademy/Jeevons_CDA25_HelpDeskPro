export function omitPassword<T extends { password: string }>(user: T): Omit<T, 'password'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- exclusion volontaire du hash
  const { password, ...safeUser } = user;
  return safeUser;
}
