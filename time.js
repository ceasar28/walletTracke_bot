// Unix timestamp
const timestamp = 1702625147;

// Convert to milliseconds and create a Date object
const date = new Date(timestamp * 1000);

// Format to UTC string
const utcDate = date.toUTCString();
console.log(utcDate);
