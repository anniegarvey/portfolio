"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { Button } from "@/components/energy-planner/common/Button";

const Container = styled.div`
  display: flex;
  height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
`;

const StyledAlertCircle = styled(AlertCircle)`
  margin-bottom: 1rem;
  height: 4rem;
  width: 4rem;
  color: var(--yellow-500, #eab308);
`;

const Title = styled.h1`
  margin-bottom: 0.5rem;
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 700;
`;

const Message = styled.p`
  margin-bottom: 1.5rem;
  color: var(--slate-600, #475569);
  
  @media (prefers-color-scheme: dark) {
    color: var(--slate-400, #94a3b8);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

export default function OfflineFallbackPage() {
  const router = useRouter();
  return (
    <Container>
      <StyledAlertCircle />
      <Title>You are offline</Title>
      <Message>It seems there's a problem with your connection.</Message>
      <ButtonGroup>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
        <Button
          onClick={() => router.push("/energy-planner")}
          variant="outline"
        >
          Go to Energy Planner
        </Button>
      </ButtonGroup>
    </Container>
  );
}
