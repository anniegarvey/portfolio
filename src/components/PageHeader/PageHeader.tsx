import { styled } from "next-yak";
import type { ReactNode } from "react";

interface PageHeaderProps {
  children: ReactNode;
}

export function PageHeader({ children }: PageHeaderProps) {
  return <Header>{children}</Header>;
}

// biome-ignore lint/style/useComponentExportOnlyModules: PageTitle is a styled component
export const PageTitle = styled.h1`
  font-size: 2.5rem;
  color: light-dark(var(--color-primary-700), var(--color-primary-300));
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  margin-block: 16px;
`;
