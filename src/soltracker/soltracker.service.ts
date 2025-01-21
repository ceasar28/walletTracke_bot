import { Injectable, Logger } from '@nestjs/common';
import {
  Connection,
  PublicKey,
  GetVersionedTransactionConfig,
} from '@solana/web3.js';
// import BigNumber from 'bignumber.js';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Call, Token } from './schemas/token.schema';
import { Model } from 'mongoose';
import { Metaplex } from '@metaplex-foundation/js';
import * as TelegramBot from 'node-telegram-bot-api';
import { showTransactionDetails, welcomeMessageMarkup } from './markups';
import { HttpService } from '@nestjs/axios';

const token = process.env.TEST_TOKEN;
@Injectable()
export class SoltrackerService {
  private readonly trackerBot: TelegramBot;
  private readonly logger = new Logger(SoltrackerService.name);
  private readonly connection: Connection;
  private isCircuitOpen = false;

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Token.name) private readonly TokenModel: Model<Token>,
    @InjectModel(Call.name) private readonly CallModel: Model<Call>,
  ) {
    this.trackerBot = new TelegramBot(token, { polling: true });
    this.connection = new Connection(process.env.SOLANA_RPC, 'confirmed');
    this.initializeCallModel();
  }

  private async initializeCallModel() {
    try {
      // Delete all existing Call documents
      await this.CallModel.deleteMany();

      // Create a new Call document
      const newCall = new this.CallModel({ call: 0 });
      await newCall.save();

      console.log('Call model re-initialized successfully.');
    } catch (error) {
      console.error('Error initializing Call model:', error);
    }
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

  sendTransactionDetails = async (data: any): Promise<unknown> => {
    try {
      const transactionDetails = await showTransactionDetails(data);
      const channelId = process.env.CHANNEL_ID;

      return await this.trackerBot.sendMessage(
        channelId,
        transactionDetails.message,
        { parse_mode: 'HTML' },
      );
    } catch (error) {
      console.log(error);
    }
  };

  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = 5,
    delay = 500,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0 && error.response?.status === 429) {
        const retryDelay = delay * 2; // Exponentially increase delay
        this.logger.warn(
          `Rate limit exceeded. Retrying after ${retryDelay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return this.retryWithBackoff(fn, retries - 1, retryDelay);
      }
      throw error; // Re-throw error if retries are exhausted or non-429 error occurs
    }
  }

  async getWalletTransactions(walletAddress: string): Promise<any[]> {
    try {
      const signatures = await this.retryWithBackoff(() =>
        this.connection.getSignaturesForAddress(new PublicKey(walletAddress), {
          limit: 50,
        }),
      );

      const config: GetVersionedTransactionConfig = {
        maxSupportedTransactionVersion: 0,
      };

      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          return await this.retryWithBackoff(() =>
            this.connection.getParsedTransaction(sig.signature, config),
          );
        }),
      );

      return transactions.filter((tx) => tx !== null);
    } catch (error) {
      this.logger.error(
        `Error fetching transactions for wallet ${walletAddress}: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  // async trackTokens(walletAddress: string): Promise<void> {
  //   if (this.isCircuitOpen) {
  //     this.logger.warn('Circuit breaker active. Skipping requests.');
  //     return;
  //   }

  //   try {
  //     const transactions = await this.getWalletTransactions(walletAddress);
  //     const _24HoursAgo = Math.floor(Date.now() / 1000) - 24 * 3600;

  //     // create a transaction map for easy loop throught
  //     // const filteredTransactions = transactions.map((tx: any) => {
  //     //   if (
  //     //     tx?.meta?.postTokenBalances &&
  //     //     tx?.meta?.postTokenBalances.length > 0
  //     //   ) {
  //     //     const tokenBought = tx.meta.postTokenBalances.find(
  //     //       (b) => b.owner === walletAddress,
  //     //     );

  //     //     // const tokenSold = tx.meta.preTokenBalances.find(
  //     //     //   (b) => b.owner === walletAddress,
  //     //     // );

  //     //     const timestamp = tx.blockTime
  //     //       ? new Date(tx.blockTime * 1000).toISOString()
  //     //       : 'Unknown';

  //     //     if (
  //     //       tokenBought &&
  //     //       tokenBought.mint !== 'So11111111111111111111111111111111111111112'
  //     //     ) {
  //     //       if (!tokenBought.mint) {
  //     //         this.logger.log('error');
  //     //       }
  //     //       return {
  //     //         mintAddress: tokenBought.mint,
  //     //         signature: tx.transaction.signatures[0],
  //     //         timestamp: timestamp,
  //     //         tokenAmount: tokenBought.uiTokenAmount.uiAmountString,
  //     //       };
  //     //     }
  //     //   }
  //     //   return;
  //     // });
  //     const filteredTransactions = transactions
  //       .filter(
  //         (tx: any) =>
  //           tx?.meta?.postTokenBalances &&
  //           tx?.meta?.postTokenBalances.length > 0 &&
  //           tx.blockTime >= _24HoursAgo, // Ensure blockTime is less than 24hrs
  //       )
  //       .map((tx: any) => {
  //         const tokenBought = tx.meta.postTokenBalances.find(
  //           (b) =>
  //             b.owner === walletAddress &&
  //             b.mint !== 'So11111111111111111111111111111111111111112', // Exclude SOL mint
  //         );

  //         if (tokenBought && tokenBought.mint) {
  //           return {
  //             mintAddress: tokenBought.mint,
  //             signature: tx.transaction.signatures[0],
  //             timestamp: new Date(tx.blockTime * 1000).toISOString(),
  //             tokenAmount: tokenBought.uiTokenAmount.uiAmountString,
  //           };
  //         }

  //         return null; // Explicitly return null for invalid entries
  //       })
  //       .filter(Boolean); // Remove null values from the result

  //     // Fetch all tokens from the database once instead of inside the loop
  //     const tokenAddresses = filteredTransactions.map((tx: any) =>
  //       tx.mintAddress.toLowerCase(),
  //     );
  //     const allTokens = await this.TokenModel.find({
  //       tokenContractAddress: { $in: tokenAddresses },
  //     });

  //     // Create a map of tokens for faster lookup
  //     const tokenMap = new Map(
  //       allTokens.map((token: any) => [token.mintAddress.toLowerCase(), token]),
  //     );

  //     // Use Promise.all for parallel asynchronous database operations
  //     const promises = filteredTransactions.map(async (tx: any) => {
  //       const tokenAddressLower = tx.mintAddress.toLowerCase();
  //       const tokenInDb = tokenMap.get(tokenAddressLower);

  //       if (tokenInDb) {
  //         const {
  //           tokenContractAddress,
  //           firstBuyTime,
  //           tokenBalance,
  //           swapSignatures,
  //         } = tokenInDb;

  //         if (!swapSignatures.includes(tx.signature)) {
  //           const newTokenBalance = +tokenBalance + +tx.tokenAmount;
  //           const updatedHashes = [...swapSignatures, tx.signature];

  //           // Immediately alert if the transaction amount is above 20k
  //           if (newTokenBalance >= 20000) {
  //             await this.sendTransactionDetails(tokenInDb);
  //             await this.sendAlert(
  //               tokenContractAddress,
  //               `${newTokenBalance}`,
  //               firstBuyTime,
  //               swapSignatures,
  //             );
  //             // await this.sendTransactionDetails(
  //             //   tokenInDb, // Include the token data for alert
  //             // );
  //           }

  //           // Update the token in the database with the new swap count and hashes
  //           await this.TokenModel.findByIdAndUpdate(
  //             tokenInDb._id,
  //             {
  //               swapHashes: updatedHashes,
  //               alertBuyTime: tx.timeStamp,
  //             },
  //             { new: true },
  //           );
  //         }
  //       } else {
  //         const metaData = await this.getTokenMetadata(tx.mintAddress);

  //         const savedToken = new this.TokenModel({
  //           tokenContractAddress: tx.mintAddress,
  //           swapSignatures: [tx.signature],
  //           tokenBalance: tx.tokenAmount,
  //           firstBuyTime: tx.timestamp,
  //           alertBuyTime: tx.timestamp,
  //           name: metaData.tokenName,
  //           symbol: metaData.tokenSymbol,
  //         });
  //         await savedToken.save();
  //         if (+savedToken.tokenBalance >= 20000 && !savedToken.alerted) {
  //           const alerted = await this.sendTransactionDetails(savedToken);
  //           await this.sendAlert(
  //             savedToken.tokenContractAddress,
  //             savedToken.tokenBalance,
  //             savedToken.tokenAge,
  //             savedToken.swapSignatures[0],
  //           );
  //           if (alerted) {
  //             await this.TokenModel.updateOne(
  //               { _id: savedToken._id },
  //               { alerted: true },
  //             );
  //           }
  //         }
  //       }
  //     });

  //     // for (const tx of transactions) {
  //     //   if (
  //     //     tx?.meta?.postTokenBalances &&
  //     //     tx?.meta?.postTokenBalances.length > 0
  //     //   ) {
  //     //     const tokenBought = tx.meta.postTokenBalances.find(
  //     //       (b) => b.owner === walletAddress,
  //     //     );

  //     //     // const tokenSold = tx.meta.preTokenBalances.find(
  //     //     //   (b) => b.owner === walletAddress,
  //     //     // );

  //     //     const timestamp = tx.blockTime
  //     //       ? new Date(tx.blockTime * 1000).toISOString()
  //     //       : 'Unknown';

  //     //     if (
  //     //       tokenBought &&
  //     //       tokenBought.mint !== 'So11111111111111111111111111111111111111112'
  //     //     ) {
  //     //       if (!tokenBought.mint) {
  //     //         this.logger.log(tokenBought);
  //     //       }
  //     //       const savedToken = new this.TokenModel({
  //     //         tokenContractAddress: tokenBought.mint,
  //     //         swapSignatures: [tx.transaction.signatures[0]],
  //     //         tokenBalance: tokenBought.uiTokenAmount.uiAmountString,
  //     //         firstBuyTime: timestamp,
  //     //         alertBuyTime: timestamp,
  //     //       });
  //     //       await savedToken.save();
  //     //       if (+savedToken.tokenBalance >= 20000) {
  //     //         await this.sendAlert(
  //     //           savedToken.tokenContractAddress,
  //     //           savedToken.tokenBalance,
  //     //           savedToken.tokenAge,
  //     //           savedToken.swapSignatures[0],
  //     //         );
  //     //       }

  //     //       this.logger.log(
  //     //         `Wallet purchased SPL tokens:
  //     //         - SPL Token Mint: ${tokenBought.mint}
  //     //         - Tokens Bought: ${tokenBought.uiTokenAmount.uiAmountString}
  //     //         - Purchase Time: ${timestamp}
  //     //         - Transaction Signature: ${tx.transaction.signatures[0]}`,
  //     //       );
  //     //     }

  //     //     // else {
  //     //     //   console.log(tokenSold);
  //     //     //   if (!tokenSold.mint) {
  //     //     //     this.logger.log(tokenSold);
  //     //     //   }
  //     //     //   this.logger.log(
  //     //     //     `Wallet SOLD SPL tokens:
  //     //     //   - SPL Token Mint: ${tokenSold.mint}
  //     //     //   - Tokens Bought: ${tokenSold.uiTokenAmount.uiAmountString}
  //     //     //   - Purchase Time: ${timestamp}
  //     //     //   - Transaction Signature: ${tx.transaction.signatures[0]}`,
  //     //     //   );
  //     //     // }

  //     //     //           this.logger.log(
  //     //     //             `Wallet purchased SPL tokens:
  //     //     // - SPL Token Mint: ${tokenBought.mint}
  //     //     // - Tokens Bought: ${tokenBought.uiTokenAmount.uiAmountString}
  //     //     // - Purchase Time: ${timestamp}
  //     //     // - Transaction Signature: ${tx.transaction.signatures[0]}`,
  //     //     //           );

  //     //     // await this.sendAlert(
  //     //     //   solSpent.toFixed(),
  //     //     //   mintAddress,
  //     //     //   tokensBought.toFixed(),
  //     //     //   timestamp,
  //     //     //   tx.transaction.signatures[0],
  //     //     // );
  //     //   }
  //     // }
  //     // Run all promises in parallel
  //     await Promise.all(promises);
  //   } catch (error: any) {
  //     if (error.response?.status === 429) {
  //       this.isCircuitOpen = true;
  //       this.logger.error('Rate limit exceeded. Circuit breaker activated.');
  //       setTimeout(() => {
  //         this.isCircuitOpen = false;
  //         this.logger.log('Circuit breaker reset.');
  //       }, 60000); // 1-minute cooldown
  //     } else {
  //       this.logger.error(
  //         `Error in trackTokens: ${error.message}`,
  //         error.stack,
  //       );
  //     }
  //   }
  // }

  // async trackTokens(walletAddress: string): Promise<void> {
  //   if (this.isCircuitOpen) {
  //     this.logger.warn('Circuit breaker active. Skipping requests.');
  //     return;
  //   }

  //   try {
  //     const transactions = await this.getWalletTransactions(walletAddress);
  //     const _24HoursAgo = Math.floor(Date.now() / 1000) - 24 * 3600;

  //     // Filter and map transactions within the last 24 hours
  //     const filteredTransactions = transactions
  //       .filter(
  //         (tx: any) =>
  //           tx?.meta?.postTokenBalances &&
  //           tx?.meta?.postTokenBalances.length > 0 &&
  //           tx.blockTime >= _24HoursAgo, // Transactions within 24 hours
  //       )
  //       .map((tx: any) => {
  //         const tokenBought = tx.meta.postTokenBalances.find(
  //           (b) =>
  //             b.owner === walletAddress &&
  //             b.mint !== 'So11111111111111111111111111111111111111112', // Exclude SOL
  //         );

  //         console.log(tx.transaction.signatures[0]);
  //         console.log(tx.meta.preTokenBalances);
  //         console.log(tx.meta.postTokenBalances);

  //         // const solSpent = tx.meta.preTokenBalances.find(
  //         //   (b) =>
  //         //     b.owner === walletAddress &&
  //         //     b.mint === 'So11111111111111111111111111111111111111112',
  //         // );

  //         if (tokenBought && tokenBought.mint) {
  //           return {
  //             mintAddress: tokenBought.mint,
  //             signature: tx.transaction.signatures[0],
  //             timestamp: new Date(tx.blockTime * 1000).toISOString(),
  //             tokenAmount: parseFloat(tokenBought.uiTokenAmount.uiAmountString),
  //             // amountspent: parseFloat(solSpent.uiTokenAmount.uiAmountString),
  //           };
  //         }

  //         return null; // Filter out invalid transactions
  //       })
  //       .filter(Boolean); // Remove null entries

  //     // Exit early if no transactions
  //     if (!filteredTransactions.length) {
  //       this.logger.log('No relevant transactions found in the last 24 hours.');
  //       return;
  //     }

  //     // Fetch tokens from the database
  //     const tokenAddresses = filteredTransactions.map((tx) => tx.mintAddress);
  //     const allTokens = await this.TokenModel.find({
  //       tokenContractAddress: { $in: tokenAddresses },
  //     });

  //     // Create a map for fast lookups
  //     const tokenMap = new Map(
  //       allTokens.map((token: any) => [token.tokenContractAddress, token]),
  //     );

  //     // Prepare database operations
  //     const promises = filteredTransactions.map(async (tx) => {
  //       const tokenAddress = tx.mintAddress;
  //       const tokenInDb = tokenMap.get(tokenAddress);

  //       if (tokenInDb) {
  //         const { tokenBalance, swapSignatures } = tokenInDb;

  //         // Skip if signature already processed
  //         if (swapSignatures.includes(tx.signature)) return;

  //         const newTokenBalance = parseFloat(tokenBalance) + tx.tokenAmount;
  //         const updatedHashes = [...swapSignatures, tx.signature];

  //         // Alert if balance exceeds threshold
  //         if (newTokenBalance >= 20000 && !tokenInDb.alerted) {
  //           await this.sendTransactionDetails(tokenInDb);
  //           await this.sendAlert(
  //             tokenInDb.tokenContractAddress,
  //             `${newTokenBalance}`,
  //             tokenInDb.firstBuyTime,
  //             updatedHashes,
  //           );

  //           await this.TokenModel.findByIdAndUpdate(
  //             tokenInDb._id,
  //             {
  //               alerted: true,
  //             },
  //             { new: true },
  //           );
  //         }

  //         // Update token in database
  //         await this.TokenModel.findByIdAndUpdate(
  //           tokenInDb._id,
  //           {
  //             tokenBalance: newTokenBalance,
  //             swapSignatures: updatedHashes,
  //             alertBuyTime: tx.timestamp,
  //           },
  //           { new: true },
  //         );
  //       } else {
  //         // Handle new token not in database
  //         const metaData = await this.getTokenMetadata(tx.mintAddress);

  //         const newToken = new this.TokenModel({
  //           tokenContractAddress: tx.mintAddress,
  //           swapSignatures: [tx.signature],
  //           tokenBalance: tx.tokenAmount,
  //           firstBuyTime: tx.timestamp,
  //           alertBuyTime: tx.timestamp,
  //           name: metaData.tokenName,
  //           symbol: metaData.tokenSymbol,
  //           // SolSpent: tx.amountspent,
  //         });
  //         await newToken.save();

  //         // Alert if above threshold
  //         if (parseFloat(newToken.tokenBalance) >= 20000) {
  //           await this.sendTransactionDetails(newToken);
  //           await this.sendAlert(
  //             newToken.tokenContractAddress,
  //             `${newToken.tokenBalance}`,
  //             newToken.firstBuyTime,
  //             newToken.swapSignatures,
  //           );

  //           // Mark as alerted
  //           await this.TokenModel.updateOne(
  //             { _id: newToken._id },
  //             { alerted: true },
  //           );
  //         }
  //       }
  //     });

  //     // Run all database operations in parallel
  //     await Promise.all(promises);
  //   } catch (error: any) {
  //     if (error.response?.status === 429) {
  //       this.isCircuitOpen = true;
  //       this.logger.error('Rate limit exceeded. Circuit breaker activated.');
  //       setTimeout(() => {
  //         this.isCircuitOpen = false;
  //         this.logger.log('Circuit breaker reset.');
  //       }, 60000); // 1-minute cooldown
  //     } else {
  //       this.logger.error(
  //         `Error in trackTokens: ${error.message}`,
  //         error.stack,
  //       );
  //     }
  //   }
  // }

  async trackTokens(walletAddress: string): Promise<void> {
    const apiKeys = [
      process.env.MORALIS_API_1,
      process.env.MORALIS_API_2,
      process.env.MORALIS_API_3,
      process.env.MORALIS_API_4,
    ];

    const swapUrl = `https://solana-gateway.moralis.io/account/mainnet/${walletAddress}/swaps?order=DESC&transactionTypes=buy`;

    try {
      const apiKeyIndex = await this.CallModel.findOne();

      const currentApiKey = apiKeys[apiKeyIndex.call];
      const response = await this.httpService.axiosRef.get(swapUrl, {
        headers: { 'X-API-Key': currentApiKey },
      });

      if (response.data.result.length > 0) {
        const transactions = response.data.result;
        const now = new Date(); // Current time
        const twentyFourHoursAgo = new Date(
          now.getTime() - 24 * 60 * 60 * 1000,
        ); // 24 hours ago

        // // Filter and map transactions within the last 24 hours
        // const filteredTransactions = transactions.filter((transaction) => {
        //   const blockTimestamp = new Date(transaction.blockTimestamp);
        //   return blockTimestamp >= twentyFourHoursAgo && blockTimestamp <= now;
        // });
        // Filter and map transactions within the last 24 hours and matching Raydium AMM v4
        const filteredTransactions = transactions.filter((transaction) => {
          const blockTimestamp = new Date(transaction.blockTimestamp);
          return (
            blockTimestamp >= twentyFourHoursAgo &&
            blockTimestamp <= now &&
            transaction.exchangeAddress ===
              '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
          );
        });

        // Fetch tokens from the database
        const tokenAddresses = filteredTransactions.map(
          (tx) => tx.bought.address,
        );

        const allTokens = await this.TokenModel.find({
          tokenContractAddress: { $in: tokenAddresses },
        });

        // Create a map for fast lookups
        const tokenMap = new Map(
          allTokens.map((token: any) => [token.tokenContractAddress, token]),
        );
        // Prepare database operations
        const promises = filteredTransactions.map(async (tx) => {
          const tokenAddress = tx.bought.address;
          const tokenInDb = tokenMap.get(tokenAddress);

          if (tokenInDb) {
            const { tokenBalance, swapSignatures, usdAmount, solAmount } =
              tokenInDb;

            // Skip if signature already processed
            if (swapSignatures.includes(tx.transactionHash)) return;

            const newTokenBalance =
              parseFloat(tokenBalance) + parseFloat(tx.bought.amount);
            const newUsdAmountBalance =
              parseFloat(usdAmount) + tx.sold.usdAmount;
            const newSolAmountBalance =
              parseFloat(solAmount) + parseFloat(tx.sold.amount);
            const updatedHashes = [...swapSignatures, tx.transactionHash];

            // Alert if balance exceeds threshold
            if (
              parseFloat(newUsdAmountBalance) >= 20000 &&
              !tokenInDb.alerted &&
              !tokenInDb.checked
            ) {
              const meetsCriteria = await this.checkTokenTimeAndMarketCap(
                tokenInDb.tokenContractAddress,
              );
              if (meetsCriteria === true) {
                await this.sendTransactionDetails({
                  tokenContractAddress: tokenInDb.tokenContractAddress,
                  name: tokenInDb.name,
                  symbol: tokenInDb.symbol,
                  alertBuyTime: tx.blockTimestamp,
                  swapSignatures: updatedHashes,
                  solAmount: newSolAmountBalance,
                  usdAmount: newUsdAmountBalance,
                  tokenBalance: newTokenBalance,
                });
                await this.sendAlert(
                  tokenInDb.tokenContractAddress,
                  `${newTokenBalance}`,
                  tokenInDb.firstBuyTime,
                  updatedHashes,
                );

                await this.TokenModel.findByIdAndUpdate(
                  tokenInDb._id,
                  {
                    alerted: true,
                    checked: true,
                  },
                  { new: true },
                );
              }
              await this.TokenModel.findByIdAndUpdate(
                tokenInDb._id,
                {
                  alerted: false,
                  checked: true,
                },
                { new: true },
              );
            }

            // Update token in database
            await this.TokenModel.findByIdAndUpdate(
              tokenInDb._id,
              {
                tokenBalance: newTokenBalance,
                swapSignatures: updatedHashes,
                alertBuyTime: tx.blockTimestamp,
                usdAmount: newUsdAmountBalance,
                solAmount: newSolAmountBalance,
              },
              { new: true },
            );
          } else {
            // Handle new token not in database
            const newToken = new this.TokenModel({
              tokenContractAddress: tx.bought.address,
              swapSignatures: [tx.transactionHash],
              tokenBalance: tx.bought.amount,
              firstBuyTime: tx.blockTimestamp,
              alertBuyTime: tx.blockTimestamp,
              name: tx.bought.name,
              symbol: tx.bought.symbol,
              usdAmount: tx.sold.usdAmount.toString(),
              solAmount: tx.sold.amount,
              // SolSpent: tx.amountspent,
            });
            await newToken.save();

            // Alert if above threshold
            if (parseFloat(newToken.usdAmount) >= 20000) {
              const meetsCriteria = await this.checkTokenTimeAndMarketCap(
                newToken.tokenContractAddress,
              );
              if (meetsCriteria === true) {
                await this.sendTransactionDetails(newToken);
                await this.sendAlert(
                  newToken.tokenContractAddress,
                  `${newToken.tokenBalance}`,
                  newToken.firstBuyTime,
                  newToken.swapSignatures,
                );
                // Mark as alerted
                await this.TokenModel.updateOne(
                  { _id: newToken._id },
                  { alerted: true, checked: true },
                );
              }
              await this.TokenModel.updateOne(
                { _id: newToken._id },
                { checked: true },
              );
            }
          }
        });

        // Run all database operations in parallel
        await Promise.all(promises);
      }
    } catch (error: any) {
      console.log(error);
    }
  }

  async sendAlert(
    splMintAddress: string,
    tokensBought: string,
    timestamp: string,
    signature: string[],
  ): Promise<void> {
    const message = `🚨 Token Purchase Alert:
- SPL Token Mint: ${splMintAddress}
- Tokens Bought: ${tokensBought}
- Purchase Time: ${timestamp}
- Transaction Signature: ${signature}`;

    this.logger.log(message);
    // Implement your notification logic (e.g., Telegram, Discord, etc.)
  }

  async getWalletTransaction(signature) {
    const transaction = await this.connection.getParsedTransaction(signature);
    console.log(transaction.meta.preTokenBalances);
  }

  async getTokenMetadata(mint: any) {
    const metaplex = Metaplex.make(this.connection);

    const mintAddress = new PublicKey(mint);

    let tokenName;
    let tokenSymbol;

    const metadataAccount = metaplex
      .nfts()
      .pdas()
      .metadata({ mint: mintAddress });

    const metadataAccountInfo =
      await this.connection.getAccountInfo(metadataAccount);

    if (metadataAccountInfo) {
      const token = await metaplex
        .nfts()
        .findByMint({ mintAddress: mintAddress });
      tokenName = token.name;
      tokenSymbol = token.symbol;
      return { tokenName, tokenSymbol };
    }
  }

  async checkTokenTimeAndMarketCap(mint: string): Promise<boolean | string> {
    // Function to check if the time is within the last 24 hours
    function isWithinLast24Hours(epochTime: number): boolean {
      const currentTime = Math.floor(Date.now() / 1000);
      const twentyFourHoursAgo = currentTime - 24 * 60 * 60;
      return epochTime >= twentyFourHoursAgo && epochTime <= currentTime;
    }

    // Function to check if market cap is above a threshold
    function isMarketCapAboveThreshold(
      marketCap: number,
      threshold: number,
    ): boolean {
      return marketCap >= threshold;
    }

    try {
      const URL = `https://pro-api.solscan.io/v2.0/token/meta?address=${mint}`;
      const getMetadata = await this.httpService.axiosRef.get(URL, {
        headers: { token: process.env.SOLSCAN_KEY },
      });

      const tokenData = getMetadata.data.data;

      if (tokenData) {
        const createdTime = tokenData.created_time;
        const marketCap = tokenData.market_cap;

        // Validate fields
        if (createdTime && marketCap) {
          if (
            isWithinLast24Hours(createdTime) &&
            isMarketCapAboveThreshold(Number(marketCap), 1_500_000)
          ) {
            return true;
          }
          return false;
        } else {
          return 'Missing required token data';
        }
      } else {
        return 'No token data available';
      }
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      throw new Error('Failed to fetch token metadata');
    }
  }

  @Cron(process.env.CRON || '*/30 * * * * *') // Executes every 30 seconds
  async handleCron(): Promise<void> {
    this.logger.log('Executing token tracking cron job...');
    // Call the token tracking function
    await this.trackTokens(process.env.SOL_WALLET);

    // Fetch the current API call index from the database
    const apiIndex = await this.CallModel.findOne(); // Assume only one document exists

    if (!apiIndex) {
      this.logger.error('Call document not found!');
      return;
    }

    // Calculate the new call index
    const newCall = (apiIndex.call + 1) % 4; // Increment and wrap back to 0 after 3

    // Update the database with the new call index
    await this.CallModel.findByIdAndUpdate(apiIndex._id, { call: newCall });

    this.logger.log(`Updated call index to ${newCall}`);
  }
}
