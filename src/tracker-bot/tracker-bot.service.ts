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

// const token =
//   process.env.NODE_ENV === 'production'
//     ? process.env.TELEGRAM_TOKEN
//     : process.env.TEST_TOKEN;
const token = process.env.TEST_TOKEN;

@Injectable()
export class TrackerBotService {
  private readonly trackerBot: TelegramBot;
  private logger = new Logger(TrackerBotService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Token.name) private readonly TokenModel: Model<Token>,
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
            return savedUser.save();
          }
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
      const allUsers = await this.UserModel.find();

      const transactionDetails = await showTransactionDetails(data);

      allUsers.forEach(async (user) => {
        try {
          return await this.trackerBot.sendMessage(
            user.userChatId,
            transactionDetails.message,
            { parse_mode: 'HTML' },
          );
        } catch (error) {
          console.log(error);
        }
      });

      return;
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
      const allToken = await this.TokenModel.find({
        tokenPairContractAddress: '0x3d2823307ddd7e21334ac3d09c5dd73263d81074',
      });

      return allToken;
    } catch (error) {
      console.log(error);
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
    where: {sender: "0x1f2F10D1C40777AE1Da742455c65828FF36Df387", from: "0xae2fc483527b8ef99eb5d9b44875f005ba1fae13",
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
                );
                if (updateToken.swapsCount === 12) {
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
    }
  };
}
