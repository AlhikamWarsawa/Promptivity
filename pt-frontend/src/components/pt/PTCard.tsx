// PT Card — placeholder component
// TODO: Implement custom sketch-style card in Day 2

export default function PTCard({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      {children}
    </div>
  );
}
