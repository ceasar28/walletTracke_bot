export const showTransactionDetails = async (data: any) => {
  function formatTimestamp(timestamp: number): string {
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
  function formatToTwoDecimals(num: number): string {
    return num.toFixed(2);
  }
  function formatNumberWithSuffix(num: number): string {
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

  console.log('detail  :', data);
  const hash = data.transaction.id;
  const blockNumber = data.transaction.blockNumber;
  const from = data.from;
  const to = data.to;
  const tokenBoughtSymbol = data.pair.token0.symbol;
  const tokenBoughtName = data.pair.token0.name;
  const tokenBoughtDecimal = data.pair.token0.decimals;
  const amount_in = formatToTwoDecimals(+data.amount1In);
  const amount_out = formatNumberWithSuffix(+data.amount0Out);
  const timestamp = formatTimestamp(data.transaction.timestamp);

  console.log(data);
  return {
    message: `<b>New Transaction Detected ✅</b>\n\n<b>Transaction Hash:</b>\n<a href="https://etherscan.io/tx/${hash}">${hash}</a>\n\n<b>Block Number: </b>${blockNumber || ''}\n<b>From: </b><a href="https://etherscan.io/addresss/${from}">jaredfromsubway.eth</a>\n<b>To: </b><a href='https://etherscan.io/addresss/${to}'>MEV BOT</a>\n\n<b>Log:</b>\n<b>Platform: </b>Uniswap V2\n<b>Token Bought✅: </b>${tokenBoughtName}(${tokenBoughtSymbol}, ${tokenBoughtDecimal} decimals)\n<b>Amount In: </b>${amount_in} ETH\n<b>Amount Out: </b>${amount_out} ${tokenBoughtSymbol}\n<b>First Transaction: </b> Yes\n<b>Time: </b>${timestamp}`,
    // keyboard: [
    //   [
    //     {
    //       text: '❌ Close',
    //       callback_data: JSON.stringify({
    //         command: '/close',
    //         language: 'english',
    //       }),
    //     },
    //   ],
    //   [
    //     {
    //       text: 'Explorer',
    //       url: `https://tronscan.org/#/token20/${pairs[dynamicKey].base_id}`,
    //     },
    //     {
    //       text: 'Sun.io',
    //       url: `https://sun.io/#/scan/tokenDetail?tokenAddress=${pairs[dynamicKey].base_id}&version=v2`,
    //     },
    //   ],
    //   [
    //     {
    //       text: 'Buy X TRX',
    //       callback_data: JSON.stringify({
    //         command: '/Tron',
    //         language: 'english',
    //       }),
    //     },
    //   ],
    // ],
  };
};
