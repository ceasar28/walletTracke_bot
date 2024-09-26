export const showTransactionDetails = async (data: any) => {
  const { transactionHash, blockNumber,from_address,from_address_label,to_address,to_address_label } = data;

  console.log(data);
  return {
    message: `<b>New Transaction Detected ✅</b>\n\n<b>Transaction Hash:</b>\n${transactionHash}\n\n<b>Block Number:</b>${blockNumber}\n<b>From:</b><a href='https://etherscan.io/addresss/${}'>
    ${pairs[dynamicKey].base_name} | <b>${pairs[dynamicKey].base_symbol}</b> | <code>${pairs[dynamicKey].base_id}</code>:\n\nPrice: $${pairs[dynamicKey].price}`,
    keyboard: [
      [
        {
          text: '❌ Close',
          callback_data: JSON.stringify({
            command: '/close',
            language: 'english',
          }),
        },
      ],
      [
        {
          text: 'Explorer',
          url: `https://tronscan.org/#/token20/${pairs[dynamicKey].base_id}`,
        },
        {
          text: 'Sun.io',
          url: `https://sun.io/#/scan/tokenDetail?tokenAddress=${pairs[dynamicKey].base_id}&version=v2`,
        },
      ],
      [
        {
          text: 'Buy X TRX',
          callback_data: JSON.stringify({
            command: '/Tron',
            language: 'english',
          }),
        },
      ],
    ],
  };
};
