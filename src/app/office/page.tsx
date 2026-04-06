import { VirtualOffice } from "@/components/office/virtual-office";

export default function OfficePage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Virtual Office</h2>
        <p className="text-xs text-muted-foreground">
          Agent workforce and activity zones
        </p>
      </div>
      <VirtualOffice />
    </div>
  );
}
