/**
 * Converts a string to Title Case (capitalize first letter of each word).
 * Handles all-caps names from the database gracefully.
 * @param {string} str
 * @returns {string}
 */
export const toTitleCase = (str) =>
  str
    ? str
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";

/**
 * Formats a date string to Indonesian locale short format.
 * @param {string} dateStr
 * @returns {string}
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
