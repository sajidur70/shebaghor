import { Link, NavLink, useNavigate } from "react-router";
import { Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "../context/AuthContext";

// NavLink calls this with { isActive }, so the link for the open page can look different.
const navClass = ({ isActive }) =>
  cn(
    "text-sm transition-colors hover:text-foreground",
    isActive ? "font-semibold text-foreground" : "text-muted-foreground",
  );

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <Wrench className="size-5 text-primary" /> ShebaGhor
        </Link>
        <nav className="flex flex-wrap items-center gap-4">
          {user?.role === "CUSTOMER" && (
            <NavLink to="/bookings" className={navClass}>
              My bookings
            </NavLink>
          )}
          {user?.role === "PROVIDER" && (
            <>
              <NavLink to="/provider" className={navClass}>
                Dashboard
              </NavLink>
              <NavLink to="/bookings" className={navClass}>
                My jobs
              </NavLink>
            </>
          )}
          {user?.role === "ADMIN" && (
            <NavLink to="/admin" className={navClass}>
              Admin
            </NavLink>
          )}

          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                Hi, {user.name.split(" ")[0]}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navClass}>
                Log in
              </NavLink>
              <Button asChild size="sm">
                <Link to="/register">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
