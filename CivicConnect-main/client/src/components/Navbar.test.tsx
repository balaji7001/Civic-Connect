import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Navbar from "./Navbar";
import { AuthContext } from "../context/AuthContext";
import { NotificationContext } from "../context/NotificationContext";

it("shows login and register links for guests", () => {
  render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          login: async () => undefined,
          register: async () => undefined,
          logout: () => undefined,
        }}
      >
        <NotificationContext.Provider
          value={{
            notifications: [],
            unreadCount: 0,
            isLoading: false,
            refreshNotifications: async () => undefined,
            markAsRead: async () => undefined,
          }}
        >
          <Navbar />
        </NotificationContext.Provider>
      </AuthContext.Provider>
    </MemoryRouter>,
  );

  expect(screen.getByText("Civic Connect")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Login" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
});
