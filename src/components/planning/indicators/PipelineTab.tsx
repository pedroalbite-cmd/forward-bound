import { LeadsByPhaseWidget } from "./LeadsByPhaseWidget";
import { DealsInProgressWidget } from "./DealsInProgressWidget";

interface PipelineTabProps {
  buKey: string;
}

export function PipelineTab({ buKey }: PipelineTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <LeadsByPhaseWidget buKey={buKey} />
      <DealsInProgressWidget buKey={buKey} />
    </div>
  );
}
