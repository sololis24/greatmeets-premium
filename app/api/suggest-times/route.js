// /app/api/suggest-times/route.js or /pages/api/suggest-times.js
import { NextResponse } from 'next/server';
import { DateTime } from 'luxon';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);


const timezoneMap = {
  // Americas
  "America/Los_Angeles": "Los Angeles",
  "America/Denver": "Denver",
  "America/Chicago": "Chicago",
  "America/New_York": "New York",
  "America/Toronto": "Toronto",
  "America/Mexico_City": "Mexico City",
  "America/Costa_Rica": "Costa Rica",
  "America/Argentina/Buenos_Aires": "Buenos Aires",
  "America/Sao_Paulo": "Sao Paulo",
  // Europe
  "Europe/London": "London",
  "Europe/Madrid": "Madrid",
  "Europe/Paris": "Paris",
  "Europe/Berlin": "Berlin",
  "Europe/Rome": "Rome",
  "Europe/Amsterdam": "Amsterdam",
  "Europe/Istanbul": "Istanbul",
  // Africa
  "Africa/Cairo": "Cairo",
  "Africa/Johannesburg": "Cape Town",
  // Middle East
  "Asia/Dubai": "Dubai",
  // Asia
  "Asia/Kolkata": "Mumbai",
  "Asia/Singapore": "Singapore",
  "Asia/Bangkok": "Bangkok",
  "Asia/Hong_Kong": "Hong Kong",
  "Asia/Tokyo": "Tokyo",
  "Asia/Seoul": "Seoul",
  // Oceania
 "Pacific/Auckland": "Wellington",
  "Australia/Sydney": "Sydney",
  "Australia/Sydney": "Melbourne",
  
};

export async function POST(req) {
  try {
    const { invitees, timeSlots, timeZone } = await req.json();

    if (!invitees || !timeSlots || invitees.length === 0 || timeSlots.length === 0) {
      return NextResponse.json({ suggestion: 'Not enough information to make a suggestion.' });
    }

    // ✅ Correctly parse local times into user's time zone
    const localTimes = timeSlots.map((slot) => {
      return DateTime.fromFormat(slot, "yyyy-MM-dd'T'HH:mm", { zone: timeZone });
    });

    // ✅ Create readable friendly local times
    const readableTimeSlots = localTimes.map(dt =>
      `- ${dt.toFormat("cccc, dd LLLL yyyy 'at' HH:mm")} (${timezoneMap[timeZone] || timeZone})`
    );

    const locations = invitees.map(i => timezoneMap[i.timezone] || i.timezone);

    const prompt = `
You are a friendly scheduling assistant.
The participants are located in these cities:
${locations.map(l => `- ${l}`).join('\n')}

Available meeting time slots (in local time) are:
${readableTimeSlots.join('\n')}

Suggest the best 2 or 3 meeting times that work for most people.
If a time is very early (before 8AM) or very late (after 7PM) for someone, add a short friendly note about it (e.g., "early morning for Lisa 🌅").
Just write your list in simple sentences, no extra explanations.
`;

    console.log("Sending prompt to OpenAI:", prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful scheduling assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return NextResponse.json({ suggestion: 'AI assistant could not generate suggestions.' });
    }

    const data = await response.json();
    const suggestion = data.choices?.[0]?.message?.content || 'No smart suggestion generated.';

    return NextResponse.json({ suggestion });

  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json({ suggestion: 'Something went wrong while generating suggestions.' });
  }
}
