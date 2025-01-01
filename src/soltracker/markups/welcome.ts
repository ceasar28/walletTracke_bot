export const welcomeMessageMarkup = async (userName: string) => {
  return {
    message: `Hi @${userName},Welcome to MEV Wallet Tracker bot`,

    keyboard: [
      [
        {
          text: 'Start Tracking 👀',
          callback_data: JSON.stringify({
            command: '/track',
            language: 'english',
          }),
        },
      ],
    ],
  };
};
