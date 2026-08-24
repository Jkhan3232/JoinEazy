function PageHeader({ eyebrow, title, description, action = null }) {
  return (
    <div className="glass-panel flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-brand-teal">{eyebrow}</p>
        <h2 className="mt-3 section-title">{title}</h2>
        <p className="mt-3 max-w-3xl text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

export default PageHeader;
