import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/format";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await login(form);
      toast.success("Welcome back.");

      const fallbackPath =
        response.user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard";

      navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-brand-teal">Access portal</p>
        <h2 className="mt-3 font-display text-4xl text-brand-ink">Sign in to continue</h2>
        <p className="mt-2 text-slate-600">
          Use the seeded admin or student credentials to walk through the assessment demo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="student1@joineazy.test"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
          required
        />

        <Button type="submit" variant="secondary" className="w-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="rounded-3xl border border-brand-line bg-white/70 p-5 text-sm text-slate-600">
        <p className="font-semibold text-brand-ink">Demo credentials</p>
        <p className="mt-2">Admin: `admin@joineazy.test` / `Admin@123`</p>
        <p>Student: `student1@joineazy.test` / `Student@123`</p>
      </div>

      <p className="text-sm text-slate-600">
        Need a new student account?{" "}
        <Link to="/register" className="font-semibold text-brand-teal">
          Register here
        </Link>
        .
      </p>
    </div>
  );
}

export default LoginPage;
