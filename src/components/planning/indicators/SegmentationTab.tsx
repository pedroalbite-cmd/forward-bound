import { MqlsByRevenueWidget } from "./MqlsByRevenueWidget";

interface SegmentationTabProps {
  buKey: string;
}

export function SegmentationTab({ buKey }: SegmentationTabProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <MqlsByRevenueWidget buKey={buKey} />
    </div>
  );
}
