import { DealsWonWidget } from "./DealsWonWidget";
import { MeetingsByRevenueWidget } from "./MeetingsByRevenueWidget";
import { NoShowWidget } from "./NoShowWidget";

interface ConversionsTabProps {
  buKey: string;
}

export function ConversionsTab({ buKey }: ConversionsTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DealsWonWidget buKey={buKey} />
      <MeetingsByRevenueWidget buKey={buKey} />
      <NoShowWidget buKey={buKey} />
    </div>
  );
}
