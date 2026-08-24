function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}) {
  const variants = {
    primary: "bg-brand-ink text-white hover:bg-slate-900",
    secondary: "bg-brand-teal text-white hover:bg-teal-700",
    ghost: "bg-white/80 text-brand-ink hover:bg-white",
    danger: "bg-brand-clay text-white hover:bg-orange-700",
  };

  return (
    <button
      type={type}
      className={[
        "rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
