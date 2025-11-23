import { styled } from "next-yak";

export default function Home() {
  return <Title>Annie Garvey Portfolio</Title>;
}

const Title = styled.h1`
  color: var(--color-primary-300);
  font-size: 2.5rem;
`;
