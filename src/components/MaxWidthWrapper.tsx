export default function MaxWidthWrapper({
  as = "div",
  padding = "32px",
  children,
}: {
  as?: React.ElementType;
  padding?: string;
  children: React.ReactNode;
}) {
  const Component = as;

  return (
    <Component
      style={{
        maxWidth: `calc(85ch + 2*${padding})`,
        marginInline: "auto",
        paddingInline: padding,
      }}
    >
      {children}
    </Component>
  );
}
