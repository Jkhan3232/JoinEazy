function EmptyState({ title, description, action = null }) {
  return (
    <div className="glass-panel p-10 text-center">
      <p className="text-sm uppercase tracking-[0.35em] text-brand-teal">Nothing here yet</p>
      <h3 className="mt-4 font-display text-3xl text-brand-ink">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-slate-600">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
