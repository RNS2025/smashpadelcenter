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