import { Module } from '@nestjs/common';
import { TrackerBotService } from './tracker-bot.service';
import { TrackerBotController } from './tracker-bot.controller';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from 'src/database/database.module';
import { Token, TokenSchema, User, UserSchema } from './schemas/token.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AlertedToken,
  AlertedTokenSchema,
} from './schemas/alertedToken.schema';
import { SoltrackerModule } from 'src/soltracker/soltracker.module';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: AlertedToken.name, schema: AlertedTokenSchema },
    ]),
    SoltrackerModule,
  ],
  providers: [TrackerBotService],
  controllers: [TrackerBotController],
})
export class TrackerBotModule {}
