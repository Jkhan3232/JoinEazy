function Loader({ label = "Loading data..." }) {
  return (
    <div className="glass-panel flex min-h-48 items-center justify-center p-6 text-center">
      <div>
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-line border-t-brand-teal" />
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-brand-teal">
          {label}
        </p>
      </div>
    </div>
  );
}

export default Loader;
