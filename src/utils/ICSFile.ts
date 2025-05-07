export const createICSFile = (title: string, description: string, location: string, start: Date, end: Date) => {
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
END:VEVENT
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

export const createCalendarURL = (title: string, description: string, location: string, start: Date, end: Date) => {
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, "").slice(0, 15);
    const startTime = formatDate(start);
    const endTime = formatDate(end);

    return `webcal://?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}&dates=${startTime}/${endTime}`;
};