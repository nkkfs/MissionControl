import { FactoryGrid } from "@/components/factory/factory-grid";

export default function FactoryPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Factory</h2>
        <p className="text-xs text-muted-foreground">
          Reusable workflow templates
        </p>
      </div>
      <FactoryGrid />
    </div>
  );
}
