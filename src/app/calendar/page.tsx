import { EventTimeline } from "@/components/calendar/event-timeline";

export default function CalendarPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-1">Calendar</h2>
        <p className="text-xs text-muted-foreground">
          Schedule and upcoming events
        </p>
      </div>
      <EventTimeline />
    </div>
  );
}
