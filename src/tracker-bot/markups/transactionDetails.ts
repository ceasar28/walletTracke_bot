export const showTransactionDetails = async (data: any) => {
  const {
    hash,
    blockNumber,
    from_address,
    from_address_label,
    to_address,
    to_address_label,
    platform,
    token,
    amount_in,
    amount_out,
    timestamp,
  } = data;

  console.log(data);
  return {
    message: `<b>New Transaction Detected ✅</b>\n\n<b>Transaction Hash:</b>\n<a href="https://etherscan.io/tx/">hash</a>\n\n<b>Block Number:</b>${blockNumber || ''}\n<b>From:</b><a href="https://etherscan.io/addresss/">address</a>\n<b>To:</b><a href='https://etherscan.io/addresss/'>address2</a>\n\n<b>Log:</b>\n<b>Platform:</b>${platform || ''}\n<b>Token Bought✅:</b>${token || ''}\n<b>Amount In:</b>${amount_in || ''} ETH\n<b>Amount Out:</b>${amount_out || ''}\n<b>First Transaction:</b> Yes\n<b>Time:</b>${timestamp || ''}`,
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
