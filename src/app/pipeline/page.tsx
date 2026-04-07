import { PipelineView } from "@/components/pipeline/pipeline-view";
import { DemoBanner } from "@/components/ui/demo-banner";

export default function PipelinePage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Pipeline</h2>
        <p className="text-xs text-muted-foreground">Active data flows</p>
      </div>
      <div className="mb-6">
        <DemoBanner reason="Gateway has not implemented pipelines.list yet. Showing local fixture data." />
      </div>
      <PipelineView />
    </div>
  );
}
