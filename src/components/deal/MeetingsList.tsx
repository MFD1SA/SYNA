import React from "react";
import { Badge } from "@/components/ui/badge";
import { Video, CalendarClock, Link2, MapPin } from "lucide-react";

interface Meeting {
  id: string;
  scheduled_at: string;
  meeting_type: string;
  meet_link?: string | null;
  notes?: string | null;
  location?: string | null;
  duration_minutes?: number;
  created_at: string;
}

interface Props {
  meetings: Meeting[];
  isAr: boolean;
  showSupervisorInfo?: boolean;
}

const MeetingsList: React.FC<Props> = ({ meetings, isAr, showSupervisorInfo }) => {
  if (meetings.length === 0) {
    return (
      <div className="text-center py-6 rounded-xl border border-dashed border-border/30 bg-muted/5">
        <Video className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" strokeWidth={1} />
        <p className="text-xs text-muted-foreground">{isAr ? "لا توجد اجتماعات" : "No meetings yet"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h6 className="text-xs font-medium text-foreground flex items-center gap-1.5">
        <Video className="h-3.5 w-3.5 text-violet-600" />
        {isAr ? "الاجتماعات" : "Meetings"} ({meetings.length})
      </h6>
      {meetings.map((m) => {
        const scheduledDate = new Date(m.scheduled_at);
        const now = new Date();
        const isPast = scheduledDate < now;
        const isToday = scheduledDate.toDateString() === now.toDateString();

        return (
          <div key={m.id} className="rounded-xl border border-border/30 bg-card p-3.5 space-y-2 transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-medium text-foreground">
                  {scheduledDate.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums" dir="ltr">
                  {scheduledDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[9px]">
                  {m.meeting_type === "google_meet" ? "Google Meet" : isAr ? "حضوري" : "In Person"}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[9px] ${
                    isToday
                      ? "bg-violet-500/10 text-violet-600 border-violet-500/20"
                      : isPast
                        ? "bg-muted text-muted-foreground"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  }`}
                >
                  {isToday ? (isAr ? "اليوم" : "Today") : isPast ? (isAr ? "منتهي" : "Past") : (isAr ? "قادم" : "Upcoming")}
                </Badge>
              </div>
            </div>
            {m.meet_link && (
              <a
                href={m.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Link2 className="h-3 w-3" />
                {isAr ? "انضم للاجتماع" : "Join Meeting"}
              </a>
            )}
            {m.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {m.location}
              </p>
            )}
            {m.notes && (
              <div className="rounded-md bg-muted/30 p-2">
                {showSupervisorInfo && (
                  <p className="text-[10px] font-medium text-muted-foreground mb-0.5">
                    {isAr ? "تفاصيل الاجتماع (من المشرف):" : "Meeting Details (from supervisor):"}
                  </p>
                )}
                <p className="text-xs text-foreground">{m.notes}</p>
              </div>
            )}
            {m.duration_minutes && (
              <p className="text-[10px] text-muted-foreground">
                {isAr ? "المدة:" : "Duration:"} <span dir="ltr">{m.duration_minutes}</span> {isAr ? "دقيقة" : "min"}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MeetingsList;
