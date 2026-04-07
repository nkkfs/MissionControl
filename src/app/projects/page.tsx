import { ProjectList } from "@/components/projects/project-list";
import { DemoBanner } from "@/components/ui/demo-banner";

export default function ProjectsPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Projects</h2>
        <p className="text-xs text-muted-foreground">
          Goals, tasks, and progress tracking
        </p>
      </div>
      <div className="mb-6">
        <DemoBanner reason="Gateway has not implemented projects.list yet. Showing local fixture data." />
      </div>
      <ProjectList />
    </div>
  );
}
