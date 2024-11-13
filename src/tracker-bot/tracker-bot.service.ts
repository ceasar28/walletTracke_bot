import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { HttpService } from '@nestjs/axios';
import { showTransactionDetails, welcomeMessageMarkup } from './markups';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Token, User } from './schemas/token.schema';
import * as dotenv from 'dotenv';
import { getTimestamps, isWithinOneHour } from './utils/query.utils';
dotenv.config();
import { Cron } from '@nestjs/schedule';
import { AlertedToken } from './schemas/alertedToken.schema';

// const token =
//   process.env.NODE_ENV === 'production'
//     ? process.env.TELEGRAM_TOKEN
//     : process.env.TEST_TOKEN;
const token = process.env.TEST_TOKEN;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class TrackerBotService {
  private readonly trackerBot: TelegramBot;
  private logger = new Logger(TrackerBotService.name);
  private isRunning = false;

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Token.name) private readonly TokenModel: Model<Token>,
    @InjectModel(Token.name)
    private readonly AlertedTokenModel: Model<AlertedToken>,
    @InjectModel(User.name) private readonly UserModel: Model<User>,
  ) {
    this.trackerBot = new TelegramBot(token, { polling: true });
    this.trackerBot.on('message', this.handleRecievedMessages);
    this.trackerBot.on('callback_query', this.handleButtonCommands);
  }

  handleRecievedMessages = async (
    msg: TelegramBot.Message,
  ): Promise<unknown> => {
    this.logger.debug(msg);
    try {
      await this.trackerBot.sendChatAction(msg.chat.id, 'typing');
      if (msg.text.trim() === '/start') {
        const username: string = `${msg.from.username}`;
        const welcome = await welcomeMessageMarkup(username);
        const replyMarkup = {
          inline_keyboard: welcome.keyboard,
        };

        return await this.trackerBot.sendMessage(msg.chat.id, welcome.message, {
          reply_markup: replyMarkup,
        });
      }
    } catch (error) {
      console.log(error);
      return await this.trackerBot.sendMessage(
        msg.chat.id,
        'There was an error processing your message',
      );
    }
  };

  handleButtonCommands = async (
    query: TelegramBot.CallbackQuery,
  ): Promise<unknown> => {
    this.logger.debug(query);
    let command: string;

    // const username = `${query.from.username}`;
    const chatId = query.message.chat.id;

    // function to check if query.data is a json type
    function isJSON(str: string) {
      try {
        JSON.parse(str);
        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    }

    if (isJSON(query.data)) {
      command = JSON.parse(query.data).command;
    } else {
      command = query.data;
    }

    try {
      console.log(command);
      switch (command) {
        // case '/track':
        //   await this.trackerBot.sendChatAction(chatId, 'typing');
        //   return await this.sendTransactionDetails(chatId);

        case '/track':
          await this.trackerBot.sendChatAction(chatId, 'typing');
          console.log('hey');
          const userExist = await this.UserModel.findOne({
            userChatId: chatId,
          });
          if (!userExist) {
            const savedUser = new this.UserModel({ userChatId: chatId });
            savedUser.save();
            return this.trackerBot.sendMessage(
              chatId,
              'Transactions tracking started',
            );
          }
          this.trackerBot.sendMessage(chatId, 'Transactions tracking started');
          return userExist;
        // setInterval(() => {
        //   this.queryBlockchain();
        // }, 60000); // Run every 60 seconds
        // return await this.queryBlockchain();

        default:
          return await this.trackerBot.sendMessage(
            chatId,
            'There was an error processing your message',
          );
      }
    } catch (error) {
      console.log(error);
      return await this.trackerBot.sendMessage(
        chatId,
        'There was an error processing your message',
      );
    }
  };

  sendTransactionDetails = async (data: any): Promise<unknown> => {
    try {
      const transactionDetails = await showTransactionDetails(data);
      const channelId = process.env.CHANNEL_ID;
      console.log(channelId);
      return await this.trackerBot.sendMessage(
        channelId,
        transactionDetails.message,
        { parse_mode: 'HTML' },
      );
    } catch (error) {
      console.log(error);
    }
  };

  // allUsers.forEach(async (user) => {
  //   try {
  //     return await this.trackerBot.sendMessage(
  //       user.userChatId,
  //       transactionDetails.message,
  //       { parse_mode: 'HTML' },
  //     );
  //   } catch (error) {
  //     console.log(error);
  //   }
  // });

  sendTokens = async (): Promise<unknown> => {
    try {
      const allToken = await this.TokenModel.find();

      return allToken;
    } catch (error) {
      console.log(error);
    }
  };

  saveAlertedTokens = async () => {
    try {
      const alertedTokens = await this.TokenModel.find({
        swapsCount: { $gte: 4 },
      });

      if (alertedTokens.length === 0) {
        console.log('No alerted tokens to save.');
        return;
      }

      // Map alerted tokens to AlertedTokenModel structure
      const alertedTokenDocs = alertedTokens.map((token) => ({
        tokenContractAddress: token.tokenContractAddress,
        swapHashes: token.swapHashes,
        name: token.name,
        swapsCount: token.swapsCount,
        tokenAge: token.tokenAge,
        firstBuyHash: token.firstBuyHash,
        firstBuyTime: token.firstBuyTime,
        symbol: token.symbol,
        decimal: token.decimal,
      }));

      // Batch insert using insertMany
      await this.AlertedTokenModel.insertMany(alertedTokenDocs);

      // Delete processed tokens from TokenModel
      const tokenIds = alertedTokens.map((token) => token._id);
      await this.TokenModel.deleteMany({ _id: { $in: tokenIds } });

      console.log(
        'Alerted tokens saved and original tokens deleted successfully.',
      );
    } catch (error) {
      console.log('Error saving alerted tokens:', error);
    }
  };

  queryBlockchain = async (): Promise<unknown> => {
    try {
      // Function to get the current time and 6 hours ago in UNIX timestamps
      const { currentTime, sixHoursAgo } = getTimestamps();

      const body = JSON.stringify({
        query: `{
  swaps(
    orderBy: timestamp
    orderDirection: desc
    where: {to: "${process.env.MEV_wallet}",
    timestamp_gte: ${sixHoursAgo},
    timestamp_lte: ${currentTime},
    amount0In: "0"}
  ) {
    id
    transaction {
      blockNumber
      id
      timestamp
    }
    timestamp
    from
    sender
    amount0In
    amount0Out
    amount1In
    amount1Out
    amountUSD
    to
    pair {
      id
      createdAtTimestamp
      token0 {
        id
        name
        symbol
        decimals
        derivedETH
      }
      token1 {
        id
        name
        symbol
        decimals
        derivedETH
      }
    }
  }
  }`,
      });
      const data = await this.httpService.axiosRef.post(
        process.env.GRAPHQL_URL,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      // console.log(data.data['data'].swaps);

      if (data.data['data'].swaps) {
        const swaps = data.data['data'].swaps;

        swaps.forEach(async (swap) => {
          // filter swaps withing 1hr of creation
          if (
            isWithinOneHour(
              +swap.transaction.timestamp,
              +swap.pair.createdAtTimestamp,
            ) &&
            swap.pair.token0.id !== '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' //WETH
          ) {
            // check if it is the db and sawp count
            const tokenExist = await this.TokenModel.findOne({
              tokenPairContractAddress: swap.pair.id.toLowerCase(),
            });
            if (!tokenExist) {
              const saveToken = new this.TokenModel({
                tokenContractAddress: swap.pair.token0.id.toLowerCase(),
                tokenPairContractAddress: swap.pair.id.toLowerCase(),
                swapHashes: [swap.id],
                name: swap.pair.token0.name,
                swapsCount: 1,
                tokenAge: swap.pair.createdAtTimestamp,
                firstBuyHash: swap.transaction.id,
                firstBuyTime: swap.transaction.timestamp,
                symbol: swap.pair.token0.symbol,
                decimal: swap.pair.token0.decimal,
              });
              saveToken.save();
            } else {
              // make sure not repeating swaps
              if (!tokenExist.swapHashes.includes(swap.id)) {
                // update token
                const updateToken = await this.TokenModel.findByIdAndUpdate(
                  tokenExist._id,
                  {
                    swapsCount: tokenExist.swapsCount + 1,
                    swapHashes: [...tokenExist.swapHashes, swap.id],
                    twentiethBuyTime: swap.transaction.timestamp,
                  },
                  { new: true }, // returns the updated document
                );
                if (updateToken.swapsCount === 8) {
                  await this.sendTransactionDetails(updateToken);
                  //TODO: change details
                }
              }
            }
          }
        });
        return;

        // const saveToken = new this.TokenModel({
        //   contractAddress: data.data['data'].swaps[0].pair.token0.id,
        //   name: data.data['data'].swaps[0].pair.token0.name,
        // });
        // saveToken.save();
        // await this.sendTransactionDetails(6954169058, data.data['data'].swaps);
      }
      return;
    } catch (error) {
      console.log(error);
    } finally {
      this.isRunning = false; // Reset the running flag after completion
      this.logger.log('Finished queryBlockchain execution');
    }
  };

  getTokenCreationTime = async (tokenAddress: string): Promise<unknown> => {
    const apiKey = process.env.ETHERSCAN_API_KEY;
    // const url = `https://api.etherscan.io/api?module=contract&action=getcontractcreation&contractaddresses=${tokenAddress}&apikey=${apiKey}`;
    //improvided api for time stamp
    const url2 = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${tokenAddress}&page=1&offset=1&startblock=0&endblock=99999999&sort=asc&apikey=${apiKey}`;
    try {
      const response = await this.httpService.axiosRef.get(url2);
      if (response.data.result.length > 0) {
        // const creationTime = response.data.result[0].timestamp;
        const creationTime2 = response.data.result[0].timeStamp;
        return parseInt(creationTime2); // Return Unix timestamp
      }
    } catch (error) {
      console.error(`Error fetching creation time for ${tokenAddress}:`, error);
    }
    return null;
  };
  getRecentTokenTransactions = async () => {
    const excludedTokens = [
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH address
      '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT address
    ];
    const sixHoursAgo = Math.floor(Date.now() / 1000) - 6 * 3600; // Unix timestamp for 6 hours ago
    const apiKey = process.env.ETHERSCAN_API_KEY;
    const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${process.env.MEV_wallet}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

    try {
      const response = await this.httpService.axiosRef.get(url);

      if (response.data.result.length > 0) {
        const transactions = response.data.result.filter((tx: any) => {
          return (
            parseInt(tx.timeStamp) >= sixHoursAgo &&
            !excludedTokens.includes(tx.contractAddress.toLowerCase()) &&
            tx.to.toLowerCase() === process.env.MEV_wallet.toLowerCase()
          );
        });

        // Fetch all tokens from the database once instead of inside the loop
        const tokenAddresses = transactions.map((tx: any) =>
          tx.contractAddress.toLowerCase(),
        );
        const allTokens = await this.TokenModel.find({
          tokenContractAddress: { $in: tokenAddresses },
        });

        // Create a map of tokens for faster lookup
        const tokenMap = new Map(
          allTokens.map((token: any) => [
            token.tokenContractAddress.toLowerCase(),
            token,
          ]),
        );

        // const oneHourAgo = Math.floor(Date.now() / 1000) - 6 * 3600;
        const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;

        // Use Promise.all for parallel asynchronous database operations
        const promises = transactions.map(async (tx: any, index: number) => {
          const tokenAddressLower = tx.contractAddress;
          const tokenInDb = tokenMap.get(tokenAddressLower);

          if (tokenInDb) {
            const { tokenAge, swapsCount, swapHashes } = tokenInDb;

            // Check if the token was created within the last hour
            if (tokenAge && +tokenAge >= oneHourAgo) {
              const newSwapsCount = swapsCount + 1;
              const updatedHashes = [...swapHashes, tx.hash];

              // Immediately alert if the transaction count reaches 8
              if (newSwapsCount === 20) {
                await this.sendTransactionDetails(
                  tokenInDb, // Include the token data for alert
                );
              }

              // Update the token in the database with the new swap count and hashes
              await this.TokenModel.findByIdAndUpdate(
                tokenInDb._id,
                {
                  swapsCount: newSwapsCount,
                  swapHashes: updatedHashes,
                  twentiethBuyTime: tx.timeStamp,
                },
                { new: true },
              );
            }
          } else {
            // Apply rate limit for getTokenCreationTime
            if (index % 5 === 0 && index !== 0) {
              await sleep(200); // 200 ms delay for every 5 calls
            }
            // Fetch the token creation time and add to MongoDB if created within the last hour
            const creationTime =
              await this.getTokenCreationTime(tokenAddressLower);
            if (creationTime && +creationTime >= oneHourAgo) {
              const saveToken = new this.TokenModel({
                tokenContractAddress: tokenAddressLower,
                swapHashes: [tx.hash],
                name: tx.tokenName,
                swapsCount: 1,
                tokenAge: creationTime,
                firstBuyHash: tx.hash,
                firstBuyTime: tx.timeStamp,
                symbol: tx.tokenSymbol,
                decimal: tx.tokenDecimal,
              });
              await saveToken.save();
              if (saveToken.swapsCount >= 20) {
                await this.sendTransactionDetails(
                  saveToken, // Include the token data for alert
                );
              }
            }
          }
        });

        // Run all promises in parallel
        await Promise.all(promises);

        // Run all promises in parallel
        await Promise.all(promises);
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.isRunning = false; // Reset the running flag after completion
      this.logger.log('Finished queryBlockchain execution');
    }
  };

  // getRecentTokenTransactions = async (): Promise<unknown> => {
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   const excludedTokens = [
  //     '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH address
  //     '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT address
  //   ];
  //   const sixHoursAgo = Math.floor(Date.now() / 1000) - 6 * 3600; // Unix timestamp for 6 hours ago
  //   const apiKey = process.env.ETHERSCAN_API_KEY;
  //   const url = `https://api.etherscan.io/api?module=account&action=tokentx&address=${process.env.MEV_wallet}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

  //   try {
  //     const response = await this.httpService.axiosRef.get(url);

  //     if (response.data.result.length > 0) {
  //       // const transactions = response.data.result;
  //       // Filter transactions within the last 6 hours
  //       // const transactions = response.data.result.filter(
  //       //   (tx: any) => parseInt(tx.timeStamp) >= sixHoursAgo,
  //       // );
  //       const transactions = response.data.result.filter((tx: any) => {
  //         return (
  //           parseInt(tx.timeStamp) >= sixHoursAgo &&
  //           ![
  //             '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  //             '0xdac17f958d2ee523a2206206994597c13d831ec7',
  //           ].includes(tx.contractAddress.toLowerCase()) &&
  //           tx.to.toLowerCase() === process.env.MEV_wallet.toLowerCase()
  //         );
  //       });
  //       // console.log(transactions);
  //       const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
  //       const allTokens = await this.TokenModel.find();

  //       for (const tx of transactions) {
  //         const tokenSymbol = tx.tokenSymbol;
  //         const tokenName = tx.tokenName;
  //         const tokenAddress = tx.contractAddress;
  //         // Check if token exists in MongoDB and if it's created within the last 1 hour
  //         const tokenInDb = allTokens.find(
  //           (t) =>
  //             t.tokenContractAddress.toLowerCase() ===
  //             tokenAddress.toLowerCase(),
  //         );

  //         // check if token exist
  //         if (tokenInDb) {
  //           const { tokenAge } = tokenInDb;

  //           // Check if the token was created within the last hour
  //           if (tokenAge && +tokenAge >= oneHourAgo) {
  //             // Optionally, update transaction count in the database
  //             const updateToken = await this.TokenModel.findByIdAndUpdate(
  //               tokenInDb._id,
  //               {
  //                 swapsCount: tokenInDb.swapsCount + 1,
  //                 swapHashes: [...tokenInDb.swapHashes, tx.hash],
  //                 twentiethBuyTime: tx.timeStamp,
  //               },
  //               { new: true }, // returns the updated document
  //             );
  //             if (updateToken.swapsCount === 1) {
  //               await this.sendTransactionDetails(updateToken);
  //               //TODO: change details
  //             }
  //           }
  //         } else {
  //           // If token isn't in the database, fetch its creation time and add it to MongoDB
  //           const creationTime = await this.getTokenCreationTime(tokenAddress);
  //           if (creationTime && +creationTime >= oneHourAgo) {
  //             // Add new token to the database
  //             const saveToken = new this.TokenModel({
  //               tokenContractAddress: tx.contractAddress.toLowerCase(),
  //               swapHashes: [tx.hash],
  //               name: tokenName,
  //               swapsCount: 1,
  //               tokenAge: creationTime,
  //               firstBuyHash: tx.hash,
  //               firstBuyTime: tx.timeStamp,
  //               symbol: tokenSymbol,
  //               decimal: tx.tokenDecimal,
  //             });
  //             saveToken.save();
  //             console.log(
  //               `Added new token ${tokenSymbol} created within 1 hour:`,
  //               tx,
  //             );
  //           }
  //         }
  //       }
  //       return;
  //     }
  //     return;
  //   } catch (error) {
  //     console.log(error);
  //   } finally {
  //     this.isRunning = false; // Reset the running flag after completion
  //     this.logger.log('Finished queryBlockchain execution');
  //   }
  // };

  @Cron(`${process.env.CRON}`) // Executes every 30 seconds
  async handleCron() {
    if (this.isRunning) {
      this.logger.warn('Previous execution still running, skipping this round');
      return;
    }

    this.isRunning = true; // Set the running flag to true

    await this.getRecentTokenTransactions();
  }
}
