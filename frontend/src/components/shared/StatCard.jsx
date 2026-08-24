function StatCard({ label, value, helper }) {
  return (
    <div className="glass-panel p-5">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-4 text-4xl font-extrabold text-brand-ink">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  );
}

export default StatCard;
