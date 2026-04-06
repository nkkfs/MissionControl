import { ContentBoard } from "@/components/content/content-board";

export default function ContentPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Content</h2>
        <p className="text-xs text-muted-foreground">
          Content pipeline by production stage
        </p>
      </div>
      <ContentBoard />
    </div>
  );
}
