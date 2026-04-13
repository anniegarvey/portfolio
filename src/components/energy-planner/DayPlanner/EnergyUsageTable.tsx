import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { styled } from "next-yak";
import type { EnergyTypeConfig } from "../../../lib/energy-planner/schema";

interface EnergyUsageTableProps {
  energyTypes: EnergyTypeConfig[];
  usage: Record<string, number>;
  dailyCapacity: Record<string, number>;
}

export function EnergyUsageTable({
  energyTypes,
  usage,
  dailyCapacity,
}: EnergyUsageTableProps) {
  return (
    <Table>
      <VisuallyHidden asChild>
        <caption>Energy Usage vs Capacity</caption>
      </VisuallyHidden>
      <VisuallyHidden asChild>
        <thead>
          <tr>
            <th scope="col">Energy Type</th>
            <th scope="col">Usage</th>
          </tr>
        </thead>
      </VisuallyHidden>
      <tbody>
        {energyTypes.map((type) => {
          const used = usage[type.id] || 0;
          const cap = dailyCapacity[type.id] || 0;
          const isOver = used > cap && cap > 0;
          // Both bars are expressed as % of 100 (max scale)
          const usagePercent = Math.min(used, 100);
          const capacityPercent = Math.min(cap, 100);

          return (
            <Row key={type.id}>
              <Label>{type.label}</Label>
              <Value>
                <Track>
                  {/* Capacity bar — subtler, behind usage */}
                  <CapacityFill
                    $color={type.color}
                    $percent={capacityPercent}
                  />
                  {/* Usage bar — solid, on top */}
                  <Fill $color={type.color} $percent={usagePercent} />
                </Track>
                <Text $isOver={isOver}>
                  {used} / {cap}
                </Text>
              </Value>
            </Row>
          );
        })}
      </tbody>
    </Table>
  );
}

const Table = styled.table`
  isolation: isolate;
`;

const Row = styled.tr`
  display: flex;
  align-items: center;
  gap: 12px;

  &:not(:last-child) {
    margin-bottom: 12px;
  }
`;

const Label = styled.td`
  display: inline-block;
  width: 80px;
  font-size: 0.875rem;
  font-weight: 500;
  color: light-dark(var(--color-grey-600), var(--color-grey-300));
`;

const Value = styled.td`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const Track = styled.div`
  flex: 1;
  height: 14px;
  background-color: light-dark(var(--color-grey-200), var(--color-grey-800));
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600));
  border-radius: 7px;
  position: relative;
  overflow: hidden;
`;

const Fill = styled.div<{ $color: string; $percent: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  transform: scaleX(${({ $percent }) => $percent / 100});
  transform-origin: left;
  background-color: ${({ $color }) => $color};
  border-radius: 7px;
  transition: transform 0.3s ease;
  z-index: 2;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const CapacityFill = styled.div<{ $color: string; $percent: number }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  /* Diagonal stripes clearly distinguish capacity ceiling from solid usage */
  background-image: repeating-linear-gradient(
    -45deg,
    ${({ $color }) => $color} 0px,
    ${({ $color }) => $color} 3px,
    transparent 3px,
    transparent 8px
  );
  opacity: 0.55;
  border-radius: 7px;
  transition: transform 0.3s ease;
  z-index: 1;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Text = styled.div<{ $isOver: boolean }>`
  width: 60px;
  text-align: right;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  font-weight: ${({ $isOver }) => ($isOver ? "700" : "500")};
  color: ${({ $isOver }) =>
    $isOver
      ? "light-dark(var(--color-orange-700), var(--color-orange-400))"
      : "light-dark(var(--color-grey-700), var(--color-grey-300))"};
`;
