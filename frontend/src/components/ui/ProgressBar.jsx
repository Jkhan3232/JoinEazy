function ProgressBar({ value = 0 }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-brand-line/70">
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-teal to-brand-clay transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export default ProgressBar;
