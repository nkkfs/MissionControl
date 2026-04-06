import { CouncilLog } from "@/components/council/council-log";

export default function CouncilPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Council</h2>
        <p className="text-xs text-muted-foreground">
          Multi-agent decision log
        </p>
      </div>
      <CouncilLog />
    </div>
  );
}
