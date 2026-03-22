import React from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiMoon, FiSave, FiArrowLeft } from "react-icons/fi";

export const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="mb-6 flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <FiArrowLeft />
        Back to Home
      </button>

      <h1 className="mb-8 text-3xl font-bold text-slate-900 dark:text-slate-100">
        Settings
      </h1>

      <div className="space-y-6">

        {/* Profile Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FiUser /> Profile Information
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Full Name"
              className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            />

            <input
              type="email"
              placeholder="Email Address"
              className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        {/* Password Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FiLock /> Change Password
          </h2>

          <div className="grid gap-4">
            <input
              type="password"
              placeholder="Current Password"
              className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            />

            <input
              type="password"
              placeholder="New Password"
              className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FiMoon /> Preferences
          </h2>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Enable Dark Mode
            </span>

            <input type="checkbox" className="h-5 w-5" />
          </div>
        </div>

        {/* Save Button */}
        <button className="flex items-center gap-2 rounded-xl bg-civic-blue px-6 py-3 font-semibold text-white hover:opacity-90">
          <FiSave />
          Save Changes
        </button>

      </div>
    </div>
  );
};