import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LockKeyhole, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import TricolorBackground from "@/components/TricolorBackground";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { toast } from "sonner";

type LocationState = {
  from?: string;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, isAuthenticated } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const redirectPath = useMemo(() => {
    const state = location.state as LocationState | null;
    return state?.from || "/features";
  }, [location.state]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (isSignup && !name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    if (password.trim().length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (isSignup && password !== confirmPassword) {
      toast.error("Password and confirm password do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignup) {
        await signup({ name, email, password });
        toast.success("Account created successfully.");
      } else {
        await login({ email, password });
        toast.success("Login successful.");
      }
      navigate(redirectPath, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      if (message.includes("auth/email-already-in-use")) {
        toast.error("This email is already registered. Please sign in.");
      } else if (message.includes("auth/invalid-credential")) {
        toast.error("Invalid email or password.");
      } else if (message.includes("auth/too-many-requests")) {
        toast.error("Too many attempts. Try again later.");
      } else if (message.includes("auth/weak-password")) {
        toast.error("Password is too weak. Use at least 6 characters.");
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-900 relative">
      <TricolorBackground intensity="strong" showOrbs={true} />

      <main className="relative z-10 min-h-screen px-4 py-8 md:py-12 flex items-center justify-center">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 md:gap-10 items-stretch">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="glass-premium rounded-[2rem] p-7 md:p-10 border border-white/60"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-navy-india/70 hover:text-navy-india mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>

            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-saffron/10 border border-saffron/20 text-saffron text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
                <LockKeyhole className="w-3 h-3" />
                Secure access
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold leading-tight tracking-tight text-navy-india mb-3">
                {isSignup ? "Create your" : "Login to"}
                <span className="premium-gradient-text"> LegalAI</span>
              </h1>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                {isSignup
                  ? "Create an account to access the assistant and legal tools."
                  : "Access the assistant and legal tools after authentication. Your home page remains public as the landing experience."}
              </p>
            </div>

            <div className="mb-6 inline-flex rounded-full border border-navy-india/15 bg-white/80 p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                  !isSignup ? "bg-navy-india text-white" : "text-navy-india/70 hover:text-navy-india"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                  isSignup ? "bg-navy-india text-white" : "text-navy-india/70 hover:text-navy-india"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.14em] font-semibold text-navy-india/70">
                    Full Name
                  </label>
                  <Input
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your full name"
                    className="h-11 rounded-xl bg-white/90 border-navy-india/20"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.14em] font-semibold text-navy-india/70">
                  Email
                </label>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="h-11 rounded-xl bg-white/90 border-navy-india/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.14em] font-semibold text-navy-india/70">
                  Password
                </label>
                <Input
                  type="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  className="h-11 rounded-xl bg-white/90 border-navy-india/20"
                />
              </div>

              {isSignup && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.14em] font-semibold text-navy-india/70">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat your password"
                    className="h-11 rounded-xl bg-white/90 border-navy-india/20"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl btn-navy font-bold uppercase tracking-[0.12em]"
              >
                {isSignup ? <UserPlus className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                {isSubmitting ? (isSignup ? "Creating account..." : "Signing in...") : isSignup ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="rounded-[2rem] bg-navy-india text-white p-7 md:p-10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-72 h-72 bg-saffron/25 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-india/25 rounded-full blur-3xl" />
            <div className="relative z-10 h-full flex flex-col justify-between gap-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/70 font-mono mb-4">
                  Authenticated workspace
                </p>
                <h2 className="text-3xl md:text-4xl font-serif font-bold leading-tight mb-4">
                  Private legal workflow
                </h2>
                <p className="text-sm text-white/80 leading-relaxed">
                  Once signed in, you can use assistant chat, drafting, summarization, comparison, and all AI tool routes.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  "Assistant and tools are protected behind login",
                  "Fast local inference powered by qwen 3b",
                  "Landing page remains publicly accessible",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-white/90">
                    <ShieldCheck className="w-4 h-4 mt-0.5 text-saffron" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
