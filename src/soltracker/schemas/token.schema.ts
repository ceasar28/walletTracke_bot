import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type UserDocument = mongoose.HydratedDocument<Token>;
export type CallDocument = mongoose.HydratedDocument<Call>;

@Schema()
export class Token {
  @Prop({ unique: true })
  tokenContractAddress: string;
  @Prop()
  swapSignatures: string[];
  @Prop()
  name: string;
  @Prop()
  symbol: string;
  @Prop()
  swapsCount: number;
  @Prop()
  tokenAge: string;
  @Prop()
  tokenBalance: string;
  @Prop()
  solAmount: string;
  @Prop()
  usdAmount: string;
  @Prop()
  firstBuyTime: string;
  @Prop()
  alertBuyTime: string;
  @Prop({ default: false })
  alerted: boolean;
  @Prop({ default: false })
  checked: boolean;
  @Prop({ default: false })
  done20k: boolean;
}

export const TokenSchema = SchemaFactory.createForClass(Token);

@Schema()
export class Call {
  @Prop()
  call: number;
}

export const CallSchema = SchemaFactory.createForClass(Call);

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

//         if (tokenBought && tokenBought.mint) {
//           return {
//             mintAddress: tokenBought.mint,
//             signature: tx.transaction.signatures[0],
//             timestamp: new Date(tx.blockTime * 1000).toISOString(),
//             tokenAmount: parseFloat(tokenBought.uiTokenAmount.uiAmountString),
//             solValue: parseFloat(tokenBought)
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
