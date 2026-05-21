import { redirect } from "next/navigation";
import { auth } from "./auth";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

/**
 * Client HTTP côté serveur (Server Components, Server Actions).
 * Injecte automatiquement le JWT de la session dans Authorization. (Code récupéré sur le repo officiel de NextAuth.js)
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const session = await auth();
  const token = session?.user?.accessToken;

  if (!token) {
    redirect("/login");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status} — ${path} : ${body}`);
  }

  // 204 No Content : pas de body
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}
