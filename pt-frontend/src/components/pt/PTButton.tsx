// PT Button — placeholder component
// TODO: Implement custom sketch-style button in Day 2

export default function PTButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props}>
      {children}
    </button>
  );
}
