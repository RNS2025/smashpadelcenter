import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {da} from "date-fns/locale";

export const safeFormatDate = (dateString: string, formatString: string): string => {
    try {
        const utcDate = new Date(dateString);
        const zoned = toZonedTime(utcDate, "Europe/Copenhagen");

        return format(zoned, formatString, { locale: da });
    } catch {
        return "Ugyldig dato";
    }
};

export const getNextHalfHour = () => {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);

    const minutes = now.getMinutes();

    if (minutes < 30) {
        now.setMinutes(30);
    } else {
        now.setHours(now.getHours() + 1);
        now.setMinutes(0);
    }

    return now;
};

export const handleHiddenTimes = (time: Date) => {
    const hour = time.getHours();
    const minutes = time.getMinutes();
    const totalMinutes = hour * 60 + minutes;

    return totalMinutes >= 330 && totalMinutes <= 1380 ? "" : "hidden";
};