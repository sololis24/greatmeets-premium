import React from 'react';

function getTimeCommentaryForInvitees(invitees, suggestionTimeUTC) {
  const dateUTC = new Date(suggestionTimeUTC);

  return invitees.map((invitee) => {
    const localTime = new Date(
      dateUTC.toLocaleString('en-US', {
        timeZone: invitee.timezone,
      })
    );

    const hour = localTime.getHours();
    const timeStr = localTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let comment = '';

    if (hour < 6) {
      comment = `that's quite early – ${invitee.name} might still be asleep 🌙`;
    } else if (hour < 9) {
      comment = `early morning for ${invitee.name}, but potentially manageable ☕️`;
    } else if (hour < 12) {
      comment = `a solid morning time for ${invitee.name} – not too early, not too late ✅`;
    } else if (hour < 17) {
      comment = `a great midday or afternoon option for ${invitee.name} 🌞`;
    } else if (hour < 20) {
      comment = `this leans into the evening for ${invitee.name} – may still work 🕯️`;
    } else if (hour < 23) {
      comment = `late for ${invitee.name}, something to consider 🌙`;
    } else {
      comment = `very late for ${invitee.name}, could be tough 😴`;
    }

    return `• ${invitee.name} (${invitee.timezone}) will see this as ${timeStr} — ${comment}`;
  });
}

export default function AISuggestion({ suggestionTime, invitees }) {
  const commentary = getTimeCommentaryForInvitees(invitees, suggestionTime).join('\n');

  return (
    <div className="bg-purple-100 text-purple-800 p-4 rounded-xl mb-6 shadow-sm space-y-2">
      <h2 className="font-bold mb-1">AI Suggestion:</h2>
      <p>
        How about <strong>{new Date(suggestionTime).toLocaleString(undefined, {
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: 'short',
          timeZoneName: 'short',
        })}</strong>?
      </p>
      <pre className="whitespace-pre-wrap text-sm text-purple-700">{commentary}</pre>
    </div>
  );
}
