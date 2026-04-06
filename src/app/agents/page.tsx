import { AgentsRegistry } from "@/components/agents/agents-registry";

export default function AgentsPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Agents</h2>
        <p className="text-xs text-muted-foreground">
          Full registry of agent definitions
        </p>
      </div>
      <AgentsRegistry />
    </div>
  );
}
