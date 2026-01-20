import { styled } from "next-yak";
import type { ReactNode } from "react";

interface PageHeaderProps {
  children: ReactNode;
}

export function PageHeader({ children }: PageHeaderProps) {
  return <Header>{children}</Header>;
}

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    margin-block: 16px;

    h1 {
      font-size: 2.5rem;
      color: light-dark(var(--color-primary-700), var(--color-primary-300));
    }
`;
