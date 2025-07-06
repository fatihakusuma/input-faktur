export function Button({ children, ...props }) {
  return <button style={{ padding: "8px 12px", background: "#007bff", color: "#fff" }} {...props}>{children}</button>;
}
