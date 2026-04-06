import { FeedbackInbox } from "@/components/feedback/feedback-inbox";

export default function FeedbackPage() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Feedback</h2>
        <p className="text-xs text-muted-foreground">
          Reviews and comments on content
        </p>
      </div>
      <FeedbackInbox />
    </div>
  );
}
