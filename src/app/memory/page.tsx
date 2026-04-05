import { MemoryList } from "@/components/memory/memory-list";

export default function MemoryPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Memory</h2>
        <p className="text-xs text-muted-foreground">
          Agent memories and knowledge base
        </p>
      </div>
      <MemoryList />
    </div>
  );
}
