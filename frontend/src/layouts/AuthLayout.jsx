import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel relative overflow-hidden px-6 py-10 sm:px-10 lg:px-12">
          <div className="absolute inset-x-8 top-8 h-32 rounded-full bg-brand-mint blur-3xl" />
          <div className="relative space-y-10">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-teal">
                Joineazy Assessment
              </p>
              <h1 className="max-w-xl font-display text-5xl leading-tight text-brand-ink sm:text-6xl">
                Student, group, and assignment operations in one interview-ready
                workspace.
              </h1>
              <p className="max-w-xl text-lg text-slate-600">
                A focused dashboard for admin oversight and student submission
                workflows, designed around the exact demo flow in the technical
                assessment.
              </p>
            </div>
          </div>
        </section>

        <section className="glass-panel flex items-center px-4 py-8 sm:px-8">
          <div className="mx-auto w-full max-w-md animate-rise">
            <Outlet />
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthLayout;
