// Unix timestamp
const timestamp = 1731523979;

// Convert to milliseconds and create a Date object
const date = new Date(timestamp * 1000);

// Format to UTC string
const utcDate = date.toUTCString();
console.log(utcDate);
