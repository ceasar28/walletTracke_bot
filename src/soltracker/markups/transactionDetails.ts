export const showTransactionDetails = async (data: any, reached?: boolean) => {
  const {
    tokenContractAddress,
    name,
    symbol,
    alertBuyTime,
    swapSignatures,
    solAmount,
    usdAmount,
    tokenBalance,
  } = data;
  // Get the last transaction hash
  const lastTransactionHash = swapSignatures[swapSignatures.length - 1];
  function formatTimestamp(isoTimestamp: string): string {
    const date = new Date(isoTimestamp);

    // Extract time and date components
    const time = date.toISOString().substring(11, 19); // Extract HH:mm:ss
    const formattedDate = date.toISOString().substring(0, 10); // Extract YYYY-MM-DD

    return `${time} ${formattedDate}`;
  }
  const formatedTime = formatTimestamp(alertBuyTime);
  // const amount_in = formatToTwoDecimals(+data.amount1In);
  // const amount_out = formatNumberWithSuffix(+data.amount0Out);
  return {
    message: `<b>Token Alert 🚨</b>\n<b>Contract Address:</b> 
<a href="https://solscan.io/token/${tokenContractAddress}">${tokenContractAddress}</a>\n\n<b>Log:</b>\n<b>Token Name✅: </b>${name} (${symbol})\n<b>Amount Bought: </b>${tokenBalance} ${symbol}\n<b>Total Sol spent: </b>${solAmount}(SOL) (~$${usdAmount})\n\n<b>Token Buy Time: </b>${formatedTime}\n<b>last buyHash: </b><a href="https://solscan.io/tx/${lastTransactionHash}">${lastTransactionHash}</a>${reached ? `\n\n🔔 Just hit above 1Mmcap` : ``}`,
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
