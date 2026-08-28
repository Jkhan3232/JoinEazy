import { getStatusTone } from "../../utils/format";

function Badge({ children }) {
  const tone = getStatusTone(children);
  const styles = {
    success: "bg-emerald-100 text-emerald-700",
    info: "bg-sky-100 text-sky-700",
    warning: "bg-amber-100 text-amber-700",
    neutral: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={["rounded-full px-3 py-1 text-xs font-semibold", styles[tone]].join(" ")}>
      {children}
    </span>
  );
}

export default Badge;
