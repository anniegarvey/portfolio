import { styled } from "next-yak";
import type { ReactNode } from "react";
import { QUERIES } from "@/lib/constants";

interface PageHeaderProps {
  children: ReactNode;
}

export function PageHeader({ children }: PageHeaderProps) {
  return <Header>{children}</Header>;
}

// biome-ignore lint/style/useComponentExportOnlyModules: PageTitle is a styled component
export const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: light-dark(var(--color-primary-700), var(--color-primary-400));
  margin: 0;
  line-height: 1.2;
  text-wrap: balance;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-block: 16px;
  flex-wrap: wrap;
`;
