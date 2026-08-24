function Card({ children, className = "" }) {
  return <div className={["glass-panel p-6", className].join(" ")}>{children}</div>;
}

export default Card;
