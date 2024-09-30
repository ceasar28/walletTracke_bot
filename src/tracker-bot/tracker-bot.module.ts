import { Module } from '@nestjs/common';
import { TrackerBotService } from './tracker-bot.service';
import { TrackerBotController } from './tracker-bot.controller';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from 'src/database/database.module';
import { Token, TokenSchema, User, UserSchema } from './schemas/token.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [TrackerBotService],
  controllers: [TrackerBotController],
})
export class TrackerBotModule {}
