import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
import { HttpService } from '@nestjs/axios';
import { showTransactionDetails, welcomeMessageMarkup } from './markups';
import * as dotenv from 'dotenv';
dotenv.config();

const token =
  process.env.NODE_ENV === 'production'
    ? process.env.TELEGRAM_TOKEN
    : process.env.TEST_TOKEN;

@Injectable()
export class TrackerBotService {
  private readonly trackerBot: TelegramBot;
  private logger = new Logger(TrackerBotService.name);

  constructor(private readonly httpService: HttpService) {
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
          return await this.queryBlockchain();

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

  sendTransactionDetails = async (
    chatId: number,
    data: any,
  ): Promise<unknown> => {
    try {
      const transactionDetails = await showTransactionDetails(data[0]);

      return await this.trackerBot.sendMessage(
        chatId,
        transactionDetails.message,
        { parse_mode: 'HTML' },
      );
    } catch (error) {
      console.log(error);
    }
  };

  queryBlockchain = async (): Promise<unknown> => {
    try {
      const body = JSON.stringify({
        query: `{
  swaps(
    orderBy: timestamp
    orderDirection: desc
    first: 1
    where: {sender: "0x1f2F10D1C40777AE1Da742455c65828FF36Df387", from: "0xae2fc483527b8ef99eb5d9b44875f005ba1fae13", amount0In: "0"}
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
      console.log(data.data['data'].swaps);
      if (data.data['data'].swaps) {
        await this.sendTransactionDetails(6954169058, data.data['data'].swaps);
      }
      return data.data['data'].swaps;
    } catch (error) {
      console.log(error);
    }
  };
}
