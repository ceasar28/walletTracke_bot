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
  // function formatToTwoDecimals(num: number): string {
  //   return num.toFixed(2);
  // }
  // function formatNumberWithSuffix(num: number): string {
  //   if (num >= 1_000_000_000) {
  //     return (num / 1_000_000_000).toFixed(2) + 'B'; // Billion
  //   } else if (num >= 1_000_000) {
  //     return (num / 1_000_000).toFixed(2) + 'M'; // Million
  //   } else if (num >= 1_000) {
  //     return (num / 1_000).toFixed(2) + 'K'; // Thousand
  //   } else {
  //     return num.toFixed(2); // Less than 1000, return as is with two decimals
  //   }
  // }

  console.log('detail  :', data);
  const {
    // tokenContractAddress,
    tokenPairContractAddress,
    // swapHashes,
    name,
    symbol,
    decimal,
    swapsCount,
    tokenAge,
    // firstBuyHash,
    firstBuyTime,
    twentiethBuyTime,
    from,
    to,
  } = data;
  // const amount_in = formatToTwoDecimals(+data.amount1In);
  // const amount_out = formatNumberWithSuffix(+data.amount0Out);
  const time = formatTimestamp(+(twentiethBuyTime - firstBuyTime));

  console.log(data);
  return {
    message: `<b>Token Alert 🚨</b>\n\n<b>Pair Contract Address:</b>\n<a href="https://etherscan.io/address/${tokenPairContractAddress}">${tokenPairContractAddress}</a>From: </b><a href="https://etherscan.io/addresss/${from}">jaredfromsubway.eth</a>\n<b>To: </b><a href='https://etherscan.io/addresss/${to}'>MEV BOT</a>\n\n<b>Log:</b>\n<b>Token Name✅: </b>${name}(${symbol}, ${decimal} decimals)\n<b>Token Pair Age: </b>${tokenAge}\n\n<b>Number of swaps: </b>${swapsCount}\n\n<b>Time Taken to complete 20 swaps: </b>${time}`,
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
