"use client";

import { keyframes, styled } from "next-yak";
import { QUERIES } from "@/lib/constants";

// ─── Skeleton primitives ──────────────────────────────────────────────────────

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
`;

const SkeletonBox = styled.div<{
  $width?: string;
  $height?: string;
  $radius?: string;
}>`
  width: ${({ $width }) => $width ?? "100%"};
  height: ${({ $height }) => $height ?? "16px"};
  border-radius: ${({ $radius }) => $radius ?? "4px"};
  background: light-dark(
    linear-gradient(90deg, var(--color-grey-200) 25%, var(--color-grey-100) 50%, var(--color-grey-200) 75%),
    linear-gradient(90deg, var(--color-grey-800) 25%, var(--color-grey-700) 50%, var(--color-grey-800) 75%)
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: light-dark(var(--color-grey-200), var(--color-grey-800));
  }
`;

// ─── Activity card skeleton ───────────────────────────────────────────────────

function ActivityCardSkeleton() {
  return (
    <SkeletonCard>
      <SkeletonBox $height="20px" $radius="3px" $width="20px" />
      <CardBody>
        <SkeletonBox $height="14px" $width="55%" />
        <SkeletonBox $height="11px" $width="30%" />
      </CardBody>
      <SkeletonBox $height="28px" $radius="4px" $width="28px" />
    </SkeletonCard>
  );
}

// ─── Zone skeleton ────────────────────────────────────────────────────────────

function ZoneSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <ZoneContainer>
      <ZoneHeaderRow>
        <SkeletonBox $height="14px" $width="90px" />
        <SkeletonBox $height="28px" $radius="4px" $width="28px" />
      </ZoneHeaderRow>
      <CardList>
        {Array.from({ length: cards }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders, order never changes
          <ActivityCardSkeleton key={i} />
        ))}
      </CardList>
      <SkeletonBox $height="34px" $radius="6px" />
    </ZoneContainer>
  );
}

// ─── DayPlannerSkeleton ───────────────────────────────────────────────────────

export function DayPlannerSkeleton() {
  return (
    <Container aria-busy="true" aria-label="Loading day plan…">
      {/* DateSelector row */}
      <DateRow>
        <SkeletonBox $height="32px" $radius="6px" $width="200px" />
      </DateRow>

      {/* Header: title + buttons */}
      <HeaderRow>
        <SkeletonBox $height="22px" $width="160px" />
        <ButtonGroup>
          <SkeletonBox $height="34px" $radius="6px" $width="120px" />
          <SkeletonBox $height="34px" $radius="6px" $width="150px" />
        </ButtonGroup>
      </HeaderRow>

      {/* Energy usage bars */}
      <UsageSection>
        <SkeletonBox $height="13px" $width="160px" />
        <UsageGrid>
          {[0, 1, 2].map((i) => (
            <UsageRow key={i}>
              <SkeletonBox $height="13px" $width="80px" />
              <SkeletonBox $height="14px" $radius="7px" />
              <SkeletonBox $height="13px" $width="48px" />
            </UsageRow>
          ))}
        </UsageGrid>
      </UsageSection>

      {/* Zone sections */}
      <ZonesStack>
        <ZoneSkeleton cards={2} />
        <ZoneSkeleton cards={1} />
        <ZoneSkeleton cards={1} />
      </ZonesStack>
    </Container>
  );
}

// ─── Styled components ────────────────────────────────────────────────────────

const Container = styled.section`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-950));
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-inline: -32px;
  padding-inline: 16px;
  border-radius: 0;

  @media (${QUERIES.PHABLET_UP}) {
    margin-inline: 0;
    padding-inline: 24px;
    border-radius: 8px;
    border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  }
`;

const DateRow = styled.div`
  margin-bottom: 8px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const UsageSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
`;

const UsageGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UsageRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  /* middle track stretches to fill available space */
  & > :nth-child(2) {
    flex: 1;
  }
`;

const ZonesStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-inline: -12px;
`;

const ZoneContainer = styled.div`
  border: 2px dotted light-dark(var(--color-grey-300), var(--color-grey-500));
  border-radius: 8px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ZoneHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid light-dark(var(--color-grey-200), var(--color-grey-600));
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 50px;
`;

const SkeletonCard = styled.div`
  background-color: light-dark(var(--color-grey-50), var(--color-grey-900));
  padding: 12px;
  border-radius: 4px;
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CardBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;
