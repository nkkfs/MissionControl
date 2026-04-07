import { DocList } from "@/components/docs/doc-list";
import { DemoBanner } from "@/components/ui/demo-banner";

export default function DocsPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Docs</h2>
        <p className="text-xs text-muted-foreground">
          Agent-generated documents and reports
        </p>
      </div>
      <div className="mb-6">
        <DemoBanner reason="Gateway has not implemented documents.list yet. Showing local fixture data." />
      </div>
      <DocList />
    </div>
  );
}
