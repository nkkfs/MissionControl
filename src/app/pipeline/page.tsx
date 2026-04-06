import { PipelineView } from "@/components/pipeline/pipeline-view";

export default function PipelinePage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Pipeline</h2>
        <p className="text-xs text-muted-foreground">Active data flows</p>
      </div>
      <PipelineView />
    </div>
  );
}
