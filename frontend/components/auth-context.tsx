"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { loadAuth, saveAuth, clearAuth, AuthUser, apiLogin, apiRegister, apiGoogleAuth } from "@/lib/auth"

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  googleLogin: (id_token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const PUBLIC_ROUTES = ["/auth"]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const { user, token } = loadAuth()
    setUser(user)
    setToken(token)
    setLoading(false)
  }, [])

  // Redirect to /auth if not logged in and not already on a public route
  useEffect(() => {
    if (loading) return
    const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
    if (!user && !isPublic) {
      router.replace("/auth")
    }
  }, [user, loading, pathname])

  const handleAuthResponse = (data: { access_token: string; user: AuthUser }) => {
    saveAuth(data.access_token, data.user)
    setToken(data.access_token)
    setUser(data.user)
    router.replace("/")
  }

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    handleAuthResponse(data)
  }

  const register = async (email: string, password: string, name: string) => {
    const data = await apiRegister(email, password, name)
    handleAuthResponse(data)
  }

  const googleLogin = async (id_token: string) => {
    const data = await apiGoogleAuth(id_token)
    handleAuthResponse(data)
  }

  const logout = () => {
    clearAuth()
    setUser(null)
    setToken(null)
    router.replace("/auth")
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
