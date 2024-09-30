import { timeAgo } from '../utils/query.utils';

export const showTransactionDetails = async (data: any) => {
  console.log('herebefore crash');
  console.log('detail  :', data);
  const {
    // tokenContractAddress,
    tokenPairContractAddress,
    // swapHashes,
    name,
    symbol,
    tokenAge,
    // firstBuyHash,
    firstBuyTime,
    twentiethBuyTime,
  } = data;

  // const amount_in = formatToTwoDecimals(+data.amount1In);
  // const amount_out = formatNumberWithSuffix(+data.amount0Out);
  const time = timeAgo(Math.abs(twentiethBuyTime - firstBuyTime));
  const formattedTokenAge = timeAgo(tokenAge);
  console.log(formattedTokenAge, symbol, name, time);
  return {
    message: `<b>Token Alert 🚨</b>\n<b>Pair Contract Address:</b> 
<a href="https://etherscan.io/address/${tokenPairContractAddress}">${tokenPairContractAddress}</a>\n\n<b>Log:</b>\n<b>Token Name✅: </b>${name} (${symbol})\n<b>Token Pair Age: </b>${formattedTokenAge}`,
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
