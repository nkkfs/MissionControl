import { ApprovalsView } from "@/components/approvals/approvals-view";

export default function ApprovalsPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Approvals</h2>
        <p className="text-xs text-muted-foreground">
          Pending review requests from the workforce
        </p>
      </div>
      <ApprovalsView />
    </div>
  );
}
