import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isYesterday from "dayjs/plugin/isYesterday";
import "dayjs/locale/fr";

dayjs.extend(relativeTime);
dayjs.extend(isYesterday);
dayjs.locale("fr");

export function formatNotificationDate(date: string) {
  const now = dayjs();
  const notifDate = dayjs(date);

  if (now.diff(notifDate, "hour") < 24) {
    return notifDate.fromNow();
  }

  if (notifDate.isYesterday()) {
    return "Hier";
  }

  return notifDate.format("DD MMMM YYYY");
}

export default dayjs;