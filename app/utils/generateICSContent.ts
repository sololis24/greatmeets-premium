import { formatInTimeZone } from 'date-fns-tz';

export function generateICSContent({
  startDate,
  duration,
  meetingTitle,
  meetingLink,
  organizerName
}: {
  startDate: Date;
  duration: number;
  meetingTitle?: string;
  meetingLink?: string;
  organizerName?: string;
}) {
  const endDate = new Date(startDate.getTime() + duration * 60000);

  const icsStart = formatInTimeZone(startDate, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
  const icsEnd = formatInTimeZone(endDate, 'UTC', "yyyyMMdd'T'HHmmss'Z'");

  const summary = meetingTitle || 'GreatMeet';
  const location = meetingLink || 'GreatMeets';
  const organizer = organizerName?.trim() || 'your organizer';

  const icsContent = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${summary}
DESCRIPTION:Scheduled via GreatMeets
DTSTART:${icsStart}
DTEND:${icsEnd}
LOCATION:${location}
STATUS:CONFIRMED
ORGANIZER;CN=${organizer}:mailto:noreply@greatmeets.ai
END:VEVENT
END:VCALENDAR`.trim();

  return { icsContent, icsStart, icsEnd, endDate };
}
