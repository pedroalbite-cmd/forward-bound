import { LostDealsWidget } from "./LostDealsWidget";
import { LossReasonsWidget } from "./LossReasonsWidget";

interface LossesTabProps {
  buKey: string;
}

export function LossesTab({ buKey }: LossesTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <LostDealsWidget buKey={buKey} />
      <LossReasonsWidget buKey={buKey} />
    </div>
  );
}
