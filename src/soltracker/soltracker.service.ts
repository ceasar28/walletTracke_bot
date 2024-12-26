import { Injectable, Logger } from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';

@Injectable()
export class SoltrackerService {
  private readonly logger = new Logger(SoltrackerService.name);
  private readonly connection: Connection;

  constructor() {
    this.connection = new Connection(
      'https://api.mainnet-beta.solana.com',
      'confirmed',
    );
  }

  async getTokenCreationTime(mintAddress: string): Promise<number | null> {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        new PublicKey(mintAddress),
        { limit: 1 },
      );

      if (signatures.length > 0) {
        const transaction = await this.connection.getTransaction(
          signatures[0].signature,
          { commitment: 'confirmed' },
        );
        return transaction?.blockTime || null; // Return Unix timestamp
      }
    } catch (error) {
      this.logger.error(
        `Error fetching creation time for mint: ${mintAddress}`,
        error,
      );
    }
    return null;
  }

  async getWalletTransactions(walletAddress: string): Promise<any[]> {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        new PublicKey(walletAddress),
        { limit: 50 }, // Adjust as needed
      );

      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          return await this.connection.getTransaction(sig.signature, {
            commitment: 'confirmed',
          });
        }),
      );

      return transactions.filter((tx) => tx !== null);
    } catch (error) {
      this.logger.error('Error fetching wallet transactions:', error);
      return [];
    }
  }

  async trackTokens(walletAddress: string): Promise<void> {
    const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 3600;
    const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
    const tokens: Map<string, { volume: BigNumber; creationTime: number }> =
      new Map();

    const transactions = await this.getWalletTransactions(walletAddress);

    for (const tx of transactions) {
      if (tx?.meta?.postTokenBalances) {
        for (const balance of tx.meta.postTokenBalances) {
          const mintAddress = balance.mint;

          // Fetch token creation time if not already fetched
          if (!tokens.has(mintAddress)) {
            const creationTime = await this.getTokenCreationTime(mintAddress);
            if (creationTime && creationTime >= oneDayAgo) {
              tokens.set(mintAddress, {
                volume: new BigNumber(0),
                creationTime,
              });
            }
          }

          const tokenData = tokens.get(mintAddress);
          if (tokenData) {
            const preBalance = tx.meta.preTokenBalances.find(
              (b) => b.mint === mintAddress,
            );
            const postBalance = tx.meta.postTokenBalances.find(
              (b) => b.mint === mintAddress,
            );

            if (preBalance && postBalance) {
              const change = new BigNumber(
                postBalance.uiTokenAmount.uiAmountString,
              ).minus(preBalance.uiTokenAmount.uiAmountString);

              tokenData.volume = tokenData.volume.plus(change.abs());
            }
          }
        }
      }
    }

    // Check token conditions
    for (const [mint, { volume, creationTime }] of tokens) {
      if (volume.gte(30000) && creationTime >= oneHourAgo) {
        this.logger.log(
          `Token ${mint} meets criteria: Volume $30k+, Age < 24h, Transactions < 1h`,
        );
        await this.sendAlert(mint, volume.toFixed(), creationTime);
      }
    }
  }

  async sendAlert(
    mintAddress: string,
    volume: string,
    creationTime: number,
  ): Promise<void> {
    const message = `🚨 Token Alert:
- Mint: ${mintAddress}
- Volume: $${volume}
- Creation Time: ${new Date(creationTime * 1000).toISOString()}
- Meets all conditions.`;

    this.logger.log(message);
    // Implement your notification logic here (e.g., send to Telegram or Discord)
  }
}
