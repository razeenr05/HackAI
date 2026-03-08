const API = "http://localhost:8000"

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar_url: string
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
}

// ---------------------------------------------------------------------------
// Token storage — localStorage so it survives page refreshes
// ---------------------------------------------------------------------------

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem("hackai_token", token)
  localStorage.setItem("hackai_user", JSON.stringify(user))
  // Keep user_id in sync for the rest of the app
  localStorage.setItem("hackai_user_id", user.id)
}

export function loadAuth(): AuthState {
  if (typeof window === "undefined") return { user: null, token: null }
  const token = localStorage.getItem("hackai_token")
  const userStr = localStorage.getItem("hackai_user")
  if (!token || !userStr) return { user: null, token: null }
  try {
    return { token, user: JSON.parse(userStr) }
  } catch {
    return { user: null, token: null }
  }
}

export function clearAuth() {
  localStorage.removeItem("hackai_token")
  localStorage.removeItem("hackai_user")
  localStorage.removeItem("hackai_user_id")
  localStorage.removeItem("hackai_goal")
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function authFetch(path: string, body: object) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || "Request failed")
  return data
}

export async function apiRegister(email: string, password: string, name: string) {
  return authFetch("/auth/register", { email, password, name })
}

export async function apiLogin(email: string, password: string) {
  return authFetch("/auth/login", { email, password })
}

export async function apiGoogleAuth(id_token: string) {
  return authFetch("/auth/google", { id_token })
}
