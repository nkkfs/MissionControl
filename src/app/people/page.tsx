import { PeopleGrid } from "@/components/people/people-grid";
import { DemoBanner } from "@/components/ui/demo-banner";

export default function PeoplePage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">People</h2>
        <p className="text-xs text-muted-foreground">
          Humans connected to this workspace
        </p>
      </div>
      <div className="mb-6">
        <DemoBanner reason="Gateway has not implemented people.list yet. Showing local fixture data." />
      </div>
      <PeopleGrid />
    </div>
  );
}
