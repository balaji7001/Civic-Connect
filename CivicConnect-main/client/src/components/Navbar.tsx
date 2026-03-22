import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  FiHome,
  FiAlertCircle,
  FiPlusCircle,
  FiClipboard,
  FiBarChart2,
  FiShield,
  FiMoon,
  FiSun,
  FiUser,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiMenu,
  FiX,
  FiBell,
} from "react-icons/fi";

import Loader from "./Loader";
import { useAuth } from "../hooks/useAuth";
import { useNotifications } from "../hooks/useNotifications";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-civic-blue text-white shadow-soft"
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
  }`;

const formatNotificationTime = (dateString: string) =>
  new Date(dateString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
  } = useNotifications();
  const [active, setActive] = useState("register");
  const [isDark, setIsDark] = useState<boolean>(
    () => localStorage.getItem("civic-connect-theme") === "dark",
  );
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("civic-connect-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    if (!isAuthenticated) {
      setOpenNotifications(false);
      setOpenProfile(false);
    }
  }, [isAuthenticated]);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-civic-blue text-lg font-black text-white">
            CC
          </span>
          <div>
            <p className="font-serif text-xl font-bold text-slate-900 dark:text-slate-100">
              Civic Connect
            </p>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Civic Issue Reporting Platform
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          <NavLink to="/" end className={navLinkClass}>
            <span className="flex items-center gap-2">
              <FiHome size={16} />
              Home
            </span>
          </NavLink>

          <NavLink to="/complaints" className={navLinkClass}>
            <span className="flex items-center gap-2">
              <FiAlertCircle size={16} />
              Complaints
            </span>
          </NavLink>

          {isAuthenticated && user?.role === "citizen" ? (
            <>
              <NavLink to="/submit" className={navLinkClass}>
                <span className="flex items-center gap-2">
                  <FiPlusCircle size={16} />
                  Report Issue
                </span>
              </NavLink>

              <NavLink to="/dashboard" className={navLinkClass}>
                <span className="flex items-center gap-2">
                  <FiClipboard size={16} />
                  My Complaints
                </span>
              </NavLink>
            </>
          ) : null}

          {isAuthenticated && user?.role === "admin" ? (
            <>
              <NavLink to="/admin" end className={navLinkClass}>
                <span className="flex items-center gap-2">
                  <FiShield size={16} />
                  Admin Dashboard
                </span>
              </NavLink>

              <NavLink to="/admin/analytics" className={navLinkClass}>
                <span className="flex items-center gap-2">
                  <FiBarChart2 size={16} />
                  Analytics
                </span>
              </NavLink>
            </>
          ) : null}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenu((current) => !current)}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200 lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenu ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>

          <button
            type="button"
            onClick={() => setIsDark((current) => !current)}
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-lg text-slate-700 transition hover:border-civic-teal hover:text-civic-teal dark:border-slate-700 dark:text-slate-200"
            aria-label="Toggle dark mode"
          >
            {isDark ? <FiSun /> : <FiMoon />}
          </button>

          {isAuthenticated ? (
            <>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !openNotifications;
                    setOpenNotifications(nextState);
                    setOpenProfile(false);
                    if (nextState) {
                      void refreshNotifications();
                    }
                  }}
                  className="relative grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-lg text-slate-700 transition hover:border-civic-teal hover:text-civic-teal dark:border-slate-700 dark:text-slate-200"
                  aria-label="View notifications"
                >
                  <FiBell />
                  {unreadCount ? (
                    <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  ) : null}
                </button>

                {openNotifications ? (
                  <div className="absolute right-0 mt-3 w-[min(24rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3 px-2 py-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Notifications
                        </p>
                        <p className="text-xs text-slate-500">
                          Recent complaint updates
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {unreadCount} unread
                      </span>
                    </div>

                    <div className="mt-2 max-h-96 space-y-2 overflow-y-auto">
                      {isLoading ? (
                        <Loader
                          label="Loading notifications..."
                          className="py-10"
                        />
                      ) : notifications.length ? (
                        notifications.map((notification) => (
                          <button
                            key={notification._id}
                            type="button"
                            onClick={() => {
                              if (!notification.read) {
                                void markAsRead(notification._id);
                              }
                            }}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                              notification.read
                                ? "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
                                : "border-civic-teal/30 bg-cyan-50 dark:border-civic-teal/40 dark:bg-cyan-950/20"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {notification.title}
                              </p>
                              {!notification.read ? (
                                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-civic-teal" />
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                              {formatNotificationTime(notification.createdAt)}
                            </p>
                          </button>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700">
                          No notifications yet.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setOpenProfile((current) => !current);
                    setOpenNotifications(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-civic-teal dark:border-slate-700 dark:text-slate-200"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-civic-blue text-white">
                    <FiUser size={16} />
                  </div>
                  <FiChevronDown size={16} />
                </button>

                {openProfile ? (
                  <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                    <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {user?.name}
                      </p>
                      <p className="text-xs text-slate-500">{user?.role}</p>
                    </div>

                    <div className="p-2">
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <FiSettings size={16} />
                        Settings
                      </Link>

                      <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <FiLogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="hidden lg:flex items-center">
              <div className="relative flex rounded-full bg-slate-100 p-1 dark:bg-slate-800">
                {/* Sliding Background */}
                <span
                  className={`absolute top-1 bottom-1 w-1/2 rounded-full bg-civic-blue shadow-md transition-all duration-300 ease-in-out
          ${active === "login" ? "left-1" : "left-1/2"}`}
                />

                {/* Login */}
                <Link
                  to="/login"
                  onMouseEnter={() => setActive("login")}
                  className={`relative z-10 px-4 py-2 text-sm font-semibold text-center w-1/2 transition-colors duration-300
          ${active === "login" ? "text-white" : "text-slate-600 dark:text-slate-300"}`}
                >
                  Login
                </Link>

                {/* Register */}
                <Link
                  to="/register"
                  onMouseEnter={() => setActive("register")}
                  className={`relative z-10 px-4 py-2 text-sm font-semibold text-center w-1/2 transition-colors duration-300
          ${active === "register" ? "text-white" : "text-slate-600 dark:text-slate-300"}`}
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {mobileMenu ? (
        <div className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <nav className="flex flex-col gap-3 px-6 py-6">
            <NavLink
              to="/"
              end
              className={navLinkClass}
              onClick={() => setMobileMenu(false)}
            >
              <span className="flex items-center gap-2">
                <FiHome size={16} />
                Home
              </span>
            </NavLink>

            <NavLink
              to="/complaints"
              className={navLinkClass}
              onClick={() => setMobileMenu(false)}
            >
              <span className="flex items-center gap-2">
                <FiAlertCircle size={16} />
                Complaints
              </span>
            </NavLink>

            {isAuthenticated && user?.role === "citizen" ? (
              <>
                <NavLink
                  to="/submit"
                  className={navLinkClass}
                  onClick={() => setMobileMenu(false)}
                >
                  <span className="flex items-center gap-2">
                    <FiPlusCircle size={16} />
                    Report Issue
                  </span>
                </NavLink>

                <NavLink
                  to="/dashboard"
                  className={navLinkClass}
                  onClick={() => setMobileMenu(false)}
                >
                  <span className="flex items-center gap-2">
                    <FiClipboard size={16} />
                    My Complaints
                  </span>
                </NavLink>
              </>
            ) : null}

            {isAuthenticated && user?.role === "admin" ? (
              <>
                <NavLink
                  to="/admin"
                  className={navLinkClass}
                  onClick={() => setMobileMenu(false)}
                >
                  <span className="flex items-center gap-2">
                    <FiShield size={16} />
                    Admin Dashboard
                  </span>
                </NavLink>

                <NavLink
                  to="/admin/analytics"
                  className={navLinkClass}
                  onClick={() => setMobileMenu(false)}
                >
                  <span className="flex items-center gap-2">
                    <FiBarChart2 size={16} />
                    Analytics
                  </span>
                </NavLink>
              </>
            ) : null}

            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenu(false)}
                  className="rounded-full border border-slate-300 px-5 py-2 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenu(false)}
                  className="rounded-full bg-civic-blue px-5 py-2 text-center text-sm font-semibold text-white"
                >
                  Register
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
};

export default Navbar;
