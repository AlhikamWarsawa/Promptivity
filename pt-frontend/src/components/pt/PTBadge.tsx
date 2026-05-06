// PT Badge — placeholder component
// TODO: Implement custom sketch-style badge in Day 2

export default function PTBadge({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...props}>
      {children}
    </span>
  );
}
