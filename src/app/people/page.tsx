import { PeopleGrid } from "@/components/people/people-grid";

export default function PeoplePage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">People</h2>
        <p className="text-xs text-muted-foreground">
          Humans connected to this workspace
        </p>
      </div>
      <PeopleGrid />
    </div>
  );
}
