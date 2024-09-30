export function isWithinOneHour(timestamp1, timestamp2) {
  const oneHourInSeconds = 5400; // 1 hour in seconds
  const difference = Math.abs(timestamp1 - timestamp2); // Get the absolute difference

  return difference <= oneHourInSeconds;
}

// Function to get the current time and 6 hours ago in UNIX timestamps
export function getTimestamps() {
  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  const sixHoursAgo = currentTime - 6 * 3600; // 6 hours ago in seconds
  return { currentTime, sixHoursAgo };
}

export function timeAgo(timestamp) {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds (Unix timestamp)
  const diffInSeconds = now - timestamp; // Difference in seconds

  if (diffInSeconds < 60) {
    return `${diffInSeconds} secs ago`;
  } else if (diffInSeconds < 3600) {
    // Less than an hour
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} mins ago`;
  } else if (diffInSeconds < 86400) {
    // Less than a day
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hours ago`;
  } else {
    // More than a day
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} days ago`;
  }
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000); // Convert from seconds to milliseconds

  // Extract date parts
  const month = date.getMonth() + 1; // Months are 0-indexed
  const day = date.getDate();
  const year = date.getFullYear();

  // Extract time parts
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Format for AM/PM
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 24-hour format to 12-hour format

  // Function to pad single-digit numbers with leading zero
  const pad = (num: number) => num.toString().padStart(2, '0');

  // Construct the formatted date and time string
  return `${month}/${day}/${year} ${hours}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
}

export function formatToTwoDecimals(num: number): string {
  return num.toFixed(2);
}
export function formatNumberWithSuffix(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(2) + 'B'; // Billion
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M'; // Million
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + 'K'; // Thousand
  } else {
    return num.toFixed(2); // Less than 1000, return as is with two decimals
  }
}
