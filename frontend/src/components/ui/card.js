export function Card({ children, ...props }) {
  return <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px" }} {...props}>{children}</div>;
}

export function CardContent({ children }) {
  return <div>{children}</div>;
}
