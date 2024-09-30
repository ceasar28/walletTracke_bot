export function isWithinOneHour(timestamp1, timestamp2) {
  const oneHourInSeconds = 3600; // 1 hour in seconds
  const difference = Math.abs(timestamp1 - timestamp2); // Get the absolute difference

  return difference <= oneHourInSeconds;
}

// Function to get the current time and 6 hours ago in UNIX timestamps
export function getTimestamps() {
  const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
  const sixHoursAgo = currentTime - 6 * 3600; // 6 hours ago in seconds
  return { currentTime, sixHoursAgo };
}
