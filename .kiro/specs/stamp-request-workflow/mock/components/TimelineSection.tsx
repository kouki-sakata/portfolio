import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle, XCircle, Send, Ban, Clock } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "submitted" | "approved" | "rejected" | "canceled";
  title: string;
  description: string;
  timestamp: string;
  isUnread?: boolean;
}

interface TimelineSectionProps {
  events: TimelineEvent[];
  onEventClick: (eventId: string) => void;
}

export function TimelineSection({ events, onEventClick }: TimelineSectionProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "submitted":
        return <Send className="h-4 w-4 text-blue-600" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "canceled":
        return <Ban className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "submitted":
        return "bg-blue-100 border-blue-300";
      case "approved":
        return "bg-green-100 border-green-300";
      case "rejected":
        return "bg-red-100 border-red-300";
      case "canceled":
        return "bg-gray-100 border-gray-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>進捗タイムライン</span>
          <Badge variant="secondary">直近のイベント</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event, index) => (
            <button
              key={event.id}
              onClick={() => onEventClick(event.id)}
              className={`w-full text-left p-4 rounded-lg border-2 ${getEventColor(
                event.type
              )} hover:shadow-md transition-all relative`}
            >
              {event.isUnread && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 text-xs"
                >
                  未読
                </Badge>
              )}
              <div className="flex items-start gap-3">
                <div className="mt-1">{getEventIcon(event.type)}</div>
                <div className="flex-1">
                  <div className="mb-1">{event.title}</div>
                  <div className="text-sm text-gray-600">{event.description}</div>
                  <div className="text-xs text-gray-500 mt-2">{event.timestamp}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
