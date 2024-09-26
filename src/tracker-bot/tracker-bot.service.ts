import { Injectable, Logger } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';
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

  async handleRecievedMessages(msg: TelegramBot.Message): Promise<unknown> {
    this.logger.debug(msg);
    try {
    } catch (error) {
      console.log(error);
      return await this.trackerBot.sendMessage(
        msg.chat.id,
        'There was an error processing your message',
      );
    }
  }

  async handleButtonCommands(
    query: TelegramBot.CallbackQuery,
  ): Promise<unknown> {
    this.logger.debug(query);
    try {
    } catch (error) {
      console.log(error);
      return await this.trackerBot.sendMessage(
        query.message.chat.id,
        'There was an error processing your message',
      );
    }
  }
}
