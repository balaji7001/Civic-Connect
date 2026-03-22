import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiX, FiMail, FiLock } from "react-icons/fi";

import { useAuth } from "../hooks/useAuth";
import { extractApiError } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <section className="mx-auto max-w-xl px-6 py-20">

      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">

        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
          Secure Sign In
        </p>

        <h1 className="mt-2 font-serif text-4xl font-bold text-slate-900 dark:text-white">
          Access your civic workspace
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Login to manage your complaints and track civic services.
        </p>

        <form
          className="mt-8 space-y-6"
          onSubmit={async (event) => {
            event.preventDefault();

            setError("");
            setIsSubmitting(true);

            try {
              await login(email, password);

              const storedUser = localStorage.getItem("civic-connect-user");
              const parsedUser = storedUser
                ? (JSON.parse(storedUser) as { role?: string })
                : null;

              const fallbackRoute =
                parsedUser?.role === "admin" ? "/admin" : "/dashboard";

              navigate(
                (location.state as { from?: string } | null)?.from ||
                  fallbackRoute
              );
            } catch (authError) {
              setError(extractApiError(authError));
            } finally {
              setIsSubmitting(false);
            }
          }}
        >

          {/* EMAIL FIELD */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email
            </label>

            <div className="relative">

              {/* Left icon */}
              <FiMail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                required
                placeholder="Enter your email"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-3 text-sm outline-none transition focus:border-civic-blue focus:ring-2 focus:ring-civic-blue/20 dark:border-slate-700 dark:bg-slate-950"
              />

              {/* Clear button */}

              {email && (
                <button
                  type="button"
                  onClick={() => setEmail("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FiX size={16} />
                </button>
              )}

            </div>
          </div>

          {/* PASSWORD FIELD */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>

            <div className="relative">

              {/* Lock icon */}

              <FiLock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                required
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-3 text-sm outline-none transition focus:border-civic-blue focus:ring-2 focus:ring-civic-blue/20 dark:border-slate-700 dark:bg-slate-950"
              />

              {/* Show password toggle */}

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>

            </div>
          </div>

          {/* ERROR MESSAGE */}

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950/30">
              {error}
            </p>
          )}

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-civic-blue px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>

        </form>

        {/* REGISTER LINK */}

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          New here?{" "}
          <Link
            to="/register"
            className="font-semibold text-civic-blue hover:underline"
          >
            Create an account
          </Link>
        </p>

      </div>

    </section>
  );
};

export default Login;