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
  font-size: 1.75rem;
  color: light-dark(var(--color-primary-700), var(--color-primary-300));
  margin: 0;
  line-height: 1.2;

  @media (${QUERIES.PHABLET_UP}) {
    font-size: 2.5rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-block: 16px;
  flex-wrap: wrap;

  @media (${QUERIES.PHABLET_UP}) {
    align-items: center;
    gap: 32px;
  }
`;
