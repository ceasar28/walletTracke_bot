import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
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

  constructor() {
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
        case '/track':
          await this.trackerBot.sendChatAction(chatId, 'typing');
          return await this.sendTransactionDetails(chatId);

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

  sendTransactionDetails = async (chatId: number): Promise<unknown> => {
    try {
      const data = {};
      const transactionDetails = await showTransactionDetails(data);

      return await this.trackerBot.sendMessage(
        chatId,
        transactionDetails.message,
        { parse_mode: 'HTML' },
      );
    } catch (error) {
      console.log(error);
    }
  };
}
