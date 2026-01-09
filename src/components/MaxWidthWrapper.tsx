export default function MaxWidthWrapper({
  as = "div",
  padding = "32px",
  children,
  ...delegated
}: {
  as?: React.ElementType;
  padding?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const Component = as;

  return (
    <Component
      {...delegated}
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
