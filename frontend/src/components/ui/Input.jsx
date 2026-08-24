function Input({ label, error, className = "", ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-brand-ink">{label}</span>
      <input
        className={[
          "w-full rounded-2xl border border-brand-line bg-white/80 px-4 py-3 text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-teal",
          className,
        ].join(" ")}
        {...props}
      />
      {error ? <span className="text-sm text-brand-clay">{error}</span> : null}
    </label>
  );
}

export function Textarea({ label, error, className = "", ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-brand-ink">{label}</span>
      <textarea
        className={[
          "min-h-32 w-full rounded-2xl border border-brand-line bg-white/80 px-4 py-3 text-brand-ink outline-none transition placeholder:text-slate-400 focus:border-brand-teal",
          className,
        ].join(" ")}
        {...props}
      />
      {error ? <span className="text-sm text-brand-clay">{error}</span> : null}
    </label>
  );
}

export default Input;
