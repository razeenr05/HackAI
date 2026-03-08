"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Loader2, MapPin, ArrowRight, Sparkles, Network, BookOpen } from "lucide-react"

declare global {
  interface Window { google?: any }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""

const features = [
  { icon: Sparkles, title: "AI-Generated Paths",    desc: "Any topic, any skill — instantly mapped" },
  { icon: Network,  title: "Visual Knowledge Graph", desc: "See how everything connects at a glance"  },
  { icon: BookOpen, title: "Curated Resources",      desc: "Videos, articles, and practice problems"  },
]

export default function AuthPage() {
  const { login, register, googleLogin, user } = useAuth()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !mounted) return
    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      if (!window.google) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      })
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        { theme: "outline", size: "large", width: "100%", text: "continue_with" }
      )
    }
    document.head.appendChild(script)
    return () => { if (document.head.contains(script)) document.head.removeChild(script) }
  }, [mounted])

  const handleGoogleCallback = async (response: { credential: string }) => {
    setLoading(true); setError("")
    try { await googleLogin(response.credential) }
    catch (err: any) { setError(err.message || "Google sign-in failed"); setLoading(false) }
  }

  const handleSubmit = async () => {
    if (!email || !password) { setError("Please fill in all fields"); return }
    if (mode === "signup" && !name) { setError("Please enter your name"); return }
    setLoading(true); setError("")
    try {
      if (mode === "login") await login(email, password)
      else await register(email, password, name)
    } catch (err: any) {
      setError(err.message || "Something went wrong")
      setLoading(false)
    }
  }

  if (user) return null

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Left panel — branding (theme-aware, matches app sidebar) ───── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12 bg-sidebar border-r border-sidebar-border">

        {/* Background texture */}
        <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, currentColor 1px, transparent 1px),
                              radial-gradient(circle at 80% 20%, currentColor 1px, transparent 1px),
                              radial-gradient(circle at 60% 80%, currentColor 1px, transparent 1px)`,
            backgroundSize: "60px 60px, 80px 80px, 40px 40px"
          }}
        />

        {/* Decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full bg-sidebar-accent/20 border border-sidebar-border" />
        <div className="absolute bottom-[-60px] left-[-60px] w-[240px] h-[240px] rounded-full bg-sidebar-accent/20 border border-sidebar-border" />
        <div className="absolute top-1/2 right-[-40px] w-[160px] h-[160px] rounded-full bg-sidebar-accent/20 border border-sidebar-border" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary border border-primary/20">
            <MapPin className="h-8 w-8 text-primary-foreground" />
          </div>
          <span className="text-3xl font-bold text-sidebar-foreground tracking-tight">MapScribe.ai</span>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight">
              Map your path<br />to mastery.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
              AI builds you a personalized knowledge graph for anything you want to learn — then guides you through it.
            </p>
          </div>

          <div className="space-y-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3 group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent border border-sidebar-border mt-0.5">
                  <Icon className="h-4 w-4 text-sidebar-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <p className="text-muted-foreground text-xs">
            From basketball to machine learning — learn anything, your way.
          </p>
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-background dark:bg-[#080a0e]">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-white/5">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <MapPin className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground text-sm">MapScribe.ai</span>
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {mode === "login" ? "No account?" : "Have an account?"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError("") }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm space-y-6">

            {/* Heading */}
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "Sign in to continue your learning journey"
                  : "Start mapping your path to mastery"}
              </p>
            </div>

            {/* Google */}
            {GOOGLE_CLIENT_ID ? (
              <div id="google-signin-btn" className="w-full" />
            ) : (
              <Button variant="outline" className="w-full h-10 gap-2" disabled>
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background dark:bg-[#080a0e] px-3 text-xs text-muted-foreground">or continue with email</span>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="h-10"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  disabled={loading}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  disabled={loading}
                  className="h-10"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                <p className="text-xs text-destructive">{error}</p>
              </div>
            )}

            <Button
              className="w-full h-10 gap-2"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By continuing you agree to our{" "}
              <span className="underline cursor-pointer hover:text-foreground transition-colors">Terms</span>
              {" "}and{" "}
              <span className="underline cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}