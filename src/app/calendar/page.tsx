import { EventTimeline } from "@/components/calendar/event-timeline";
import { DemoBanner } from "@/components/ui/demo-banner";

export default function CalendarPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Calendar</h2>
        <p className="text-xs text-muted-foreground">
          Schedule and upcoming events
        </p>
      </div>
      <div className="mb-6">
        <DemoBanner reason="Gateway has not implemented schedule.list yet. Showing local fixture data." />
      </div>
      <EventTimeline />
    </div>
  );
}
