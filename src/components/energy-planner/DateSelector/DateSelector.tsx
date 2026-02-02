"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { styled } from "next-yak";
import { formatDateForDisplay } from "@/hooks/utils";

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
      <NavButton
        aria-label="Previous day"
        onClick={onPreviousDay}
        type="button"
      >
        <ChevronLeft size={20} />
      </NavButton>
      <DateDisplay>
        <CurrentDate>{formatDateForDisplay(currentDate)}</CurrentDate>
        {!viewingToday && (
          <TodayButton onClick={onGoToToday} type="button">
            Go to Today
          </TodayButton>
        )}
        {viewingToday && <TodayIndicator>Today</TodayIndicator>}
      </DateDisplay>
      <NavButton aria-label="Next day" onClick={onNextDay} type="button">
        <ChevronRight size={20} />
      </NavButton>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: light-dark(var(--color-grey-100), var(--color-grey-700));
  border: 1px solid var(--color-grey-300);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s var(--ease);

  &:hover {
    background-color: light-dark(var(--color-grey-200), var(--color-grey-600));
  }

  &:active {
    transform: scale(0.95);
  }
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

const TodayButton = styled.button`
  background: none;
  border: none;
  color: var(--color-primary-600);
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: var(--color-primary-700);
  }
`;

const TodayIndicator = styled.span`
  font-size: 0.75rem;
  color: light-dark(var(--color-teal-800), var(--color-teal-200));
  font-weight: 500;
  background-color: light-dark(var(--color-teal-100), var(--color-teal-900));
  padding: 2px 8px;
  border-radius: 999px;
`;
