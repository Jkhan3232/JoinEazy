import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { professorNavigation, studentNavigation } from "../utils/constants";
import { formatRoleLabel } from "../utils/format";

function AppShell() {
  const { user, logout } = useAuth();
  const navigation =
    user?.role === "PROFESSOR" ? professorNavigation : studentNavigation;
  const isProfessor = user?.role === "PROFESSOR";

  return (
    <div className="page-shell">
      <div className="shell-grid">
        <aside className="console-sidebar">
          <div className="console-card">
            <div className="console-header">
              <p className="console-brand">JOINEAZY</p>
              <h1 className="console-title">
                {isProfessor ? "Professor Console" : "Student Hub"}
              </h1>
              <p className="console-email">{user?.email}</p>
            </div>

            <div className="console-nav-wrap">
              <nav className="console-nav" aria-label="Sidebar navigation">
                {navigation.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "console-nav-link",
                        isActive ? "console-nav-link--active" : "",
                      ].join(" ")
                    }>
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="profile-card">
                <p className="profile-label">Signed in as</p>
                <p className="profile-name">{user?.name}</p>
                <p className="profile-role">{formatRoleLabel(user?.role)}</p>
                <button
                  type="button"
                  onClick={logout}
                  className="logout-button">
                  Log out
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="main-panel">
          <header className="workspace-banner">
            <div className="workspace-copy">
              <p className="workspace-label">Workspace</p>
              <h2 className="workspace-title">
                {isProfessor
                  ? "Oversee courses, assignments, analytics, and submissions"
                  : "Track group progress and confirm assignment submissions"}
              </h2>
            </div>
          </header>

          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
