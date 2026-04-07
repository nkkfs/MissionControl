import { ApprovalsView } from "@/components/approvals/approvals-view";
import { DemoBanner } from "@/components/ui/demo-banner";

export default function ApprovalsPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Approvals</h2>
        <p className="text-xs text-muted-foreground">
          Pending review requests from the workforce
        </p>
      </div>
      <div className="mb-6">
        <DemoBanner reason="Gateway has not implemented approvals.list yet. Showing local fixture data." />
      </div>
      <ApprovalsView />
    </div>
  );
}
