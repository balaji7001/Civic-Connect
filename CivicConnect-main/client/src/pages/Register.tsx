import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiEye,
  FiEyeOff,
  FiX,
  FiUser,
  FiMail,
  FiLock,
  FiMapPin,
  FiHome,
} from "react-icons/fi";

import { useAuth } from "../hooks/useAuth";
import { extractApiError } from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    ward: "",
    address: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <section className="mx-auto max-w-2xl px-6 py-20">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">
          Citizen Onboarding
        </p>

        <h1 className="mt-2 font-serif text-4xl font-bold text-slate-900 dark:text-white">
          Create your Civic Connect account
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Register to report civic issues and track complaint resolutions.
        </p>

        <form
          className="mt-8 grid gap-6 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();

            setError("");
            setIsSubmitting(true);

            try {
              await register(form);
              navigate("/dashboard");
            } catch (authError) {
              setError(extractApiError(authError));
            } finally {
              setIsSubmitting(false);
            }
          }}
        >

          {/* FULL NAME */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Full name
            </label>

            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-3 text-sm outline-none transition focus:border-civic-teal focus:ring-2 focus:ring-civic-teal/20 dark:border-slate-700 dark:bg-slate-950"
              />

              {form.name && (
                <button
                  type="button"
                  onClick={() => updateField("name", "")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>

          {/* EMAIL */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Email
            </label>

            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
                placeholder="Enter your email"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-3 text-sm outline-none transition focus:border-civic-teal focus:ring-2 focus:ring-civic-teal/20 dark:border-slate-700 dark:bg-slate-950"
              />

              {form.email && (
                <button
                  type="button"
                  onClick={() => updateField("email", "")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FiX size={16} />
                </button>
              )}
            </div>
          </div>

          {/* PASSWORD */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>

            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                required
                placeholder="Create a secure password"
                className="w-full rounded-xl border border-slate-300 pl-10 pr-10 py-3 text-sm outline-none transition focus:border-civic-teal focus:ring-2 focus:ring-civic-teal/20 dark:border-slate-700 dark:bg-slate-950"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {/* WARD */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Ward
            </label>

            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                value={form.ward}
                onChange={(e) => updateField("ward", e.target.value)}
                required
                placeholder="Ward number"
                className="w-full rounded-xl border border-slate-300 pl-10 py-3 text-sm outline-none transition focus:border-civic-teal focus:ring-2 focus:ring-civic-teal/20 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          {/* ADDRESS */}

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Address
            </label>

            <div className="relative">
              <FiHome className="absolute left-3 top-4 text-slate-400" />

              <textarea
                rows={4}
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                required
                placeholder="Enter your residential address"
                className="w-full rounded-xl border border-slate-300 pl-10 py-3 text-sm outline-none transition focus:border-civic-teal focus:ring-2 focus:ring-civic-teal/20 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <p className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950/30">
              {error}
            </p>
          )}

          {/* BUTTON */}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-civic-teal px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </button>
          </div>

        </form>

        {/* LOGIN LINK */}

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-civic-blue hover:underline"
          >
            Login
          </Link>
        </p>

      </div>
    </section>
  );
};

export default Register;