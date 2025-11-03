import i18n from "../i18n";

/**
 * @param {Date | string | number} date - Date object, timestamp, or ISO string
 * @param {"short" | "medium" | "long" | "full"} style - Date format style
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export const formatDate = (date, style = "medium", includeTime = false) => {
  if (!date) return "";

  const parsedDate = new Date(date);
  if (isNaN(parsedDate)) return "";

  const options = {};

  switch (style) {
    case "short":
      options.dateStyle = "short";
      break;
    case "long":
      options.dateStyle = "long";
      break;
    case "full":
      options.dateStyle = "full";
      break;
    default:
      options.dateStyle = "medium";
      break;
  }

  if (includeTime) {
    options.timeStyle = "short";
  }

  return new Intl.DateTimeFormat(i18n.language, options).format(parsedDate);
};

/**
 * @param {Date | string | number} startTime - Start time
 * @param {Date | string | number} endTime - End time
 * @returns {string} Formatted duration string (e.g., "1h 30m")
 */
export const formatDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "";

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start) || isNaN(end)) return "";

  const diffMs = end.getTime() - start.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  const hours = diffHours;
  const minutes = diffMinutes % 60;
  const seconds = diffSeconds % 60;

  let durationString = "";
  if (hours > 0) {
    durationString += `${hours}h `;
  }
  if (minutes > 0) {
    durationString += `${minutes}m `;
  }
  if (seconds > 0 || durationString === "") { // Show seconds if no hours/minutes, or if duration is 0
    durationString += `${seconds}s`;
  }

  return durationString.trim();
};
