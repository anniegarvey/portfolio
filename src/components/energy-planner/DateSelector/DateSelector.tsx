"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { styled } from "next-yak";
import { formatDateForDisplay } from "@/hooks/utils";
import { Button } from "../common";

interface DateSelectorProps {
  currentDate: string;
  viewingToday: boolean;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onGoToToday: () => void;
}

export function DateSelector({
  currentDate,
  viewingToday,
  onPreviousDay,
  onNextDay,
  onGoToToday,
}: DateSelectorProps) {
  return (
    <Container>
      <Button
        aria-label="Previous day"
        intent="secondary"
        onClick={onPreviousDay}
        size="icon"
        variant="outline"
      >
        <ChevronLeft size={20} />
      </Button>
      <DateDisplay>
        <CurrentDate>{formatDateForDisplay(currentDate)}</CurrentDate>
        {!viewingToday && (
          <Button onClick={onGoToToday} variant="link">
            Go to Today
          </Button>
        )}
        {viewingToday && <TodayIndicator>Today</TodayIndicator>}
      </DateDisplay>
      <Button
        aria-label="Next day"
        intent="secondary"
        onClick={onNextDay}
        size="icon"
        variant="outline"
      >
        <ChevronRight size={20} />
      </Button>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const DateDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 200px;
`;

const CurrentDate = styled.span`
  font-size: 1.1rem;
  font-weight: 600;
  color: light-dark(var(--color-grey-800), var(--color-grey-100));
`;

const TodayIndicator = styled.span`
  font-size: 0.75rem;
  color: light-dark(var(--color-teal-800), var(--color-teal-200));
  font-weight: 500;
  background-color: light-dark(var(--color-teal-100), var(--color-teal-900));
  padding: 2px 8px;
  border-radius: 999px;
`;
