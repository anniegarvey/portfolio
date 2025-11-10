import { styled } from "next-yak";

export default function Home() {
  return (
    <div>
      <main>
        <div>
          <Title>Anne Garvey Portfolio</Title>
        </div>
      </main>
    </div>
  );
}

const Title = styled.h1`
  color: hsl(280, 73.60%, 31.20%);
`;
