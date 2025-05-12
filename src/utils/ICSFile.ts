export const createCalendarURL = (
  title: string,
  description: string,
  location: string,
  start: Date,
  end: Date,
  participants: string[] = [] // <-- Tilføjet: Parameter for deltagere
) => {
  const formatDate = (date: Date) =>
    date
      .toISOString()
      .replace(/-|:|\.\d+/g, "")
      .slice(0, 15);
  const startTime = formatDate(start);
  const endTime = formatDate(end);

  // Formatér deltagerlisten til en streng
  let participantsString = "";
  if (participants.length > 0) {
    participantsString = "\nDeltagere: " + participants.join(", "); // Tilføjer linjeskift og lister navne adskilt af komma
  }

  // Kombiner den oprindelige beskrivelse med deltagerlisten
  const fullDescription = description + participantsString;

  return `webcal://?action=TEMPLATE&text=${encodeURIComponent(
    title
  )}&details=${encodeURIComponent(
    fullDescription
  )}&location=${encodeURIComponent(location)}&dates=${startTime}/${endTime}`;
};

// Beholder dine andre funktioner som de er
export const createICSFile = (
  title: string,
  description: string,
  location: string,
  start: Date,
  end: Date,
  participants: string[] = []
) => {
  const pad = (n: number) => (n < 10 ? "0" + n : n);

  const formatDate = (date: Date) =>
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z";

  const attendees = participants
    .map((participant) => `ATTENDEE;CN="${participant}":MAILTO:`)
    .join("\n ");

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//smash-klubapp//DA
BEGIN:VEVENT
UID:${Date.now()}rns-apps.dk
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(start)}
DTEND:${formatDate(end)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
${attendees.length > 0 ? attendees + "\n" : ""}END:VEVENT
END:VCALENDAR`;
};

export const downloadICSFile = (icsContent: string, filename = "event.ics") => {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
