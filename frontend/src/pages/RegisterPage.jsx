import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage } from "../utils/format";

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setErrors((current) => ({ ...current, [event.target.name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 2)
      nextErrors.name = "Please enter your full name.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    if (form.password.length < 8)
      nextErrors.password = "Password must be at least 8 characters.";
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setSubmitting(true);

    try {
      await register(form);
      toast.success("Student account created successfully.");
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-brand-teal">
          Student registration
        </p>
        <h2 className="mt-3 font-display text-4xl text-brand-ink">
          Create your account
        </h2>
        <p className="mt-2 text-slate-600">
          Registration is student-only. Admin accounts are provisioned through
          database seed data.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Student Name"
          error={errors.name}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="student5@joineazy.test"
          error={errors.email}
          required
        />
        <div className="relative">
          <Input
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={handleChange}
            placeholder="Use at least 8 characters"
            error={errors.password}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-9 rounded-lg px-2 py-1 text-xs font-semibold text-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <Button
          type="submit"
          variant="secondary"
          className="w-full"
          disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-teal">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}

export default RegisterPage;
