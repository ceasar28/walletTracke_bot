import { Module } from '@nestjs/common';
import { SoltrackerService } from './soltracker.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Call, CallSchema, Token, TokenSchema } from './schemas/token.schema';
import { DatabaseModule } from 'src/database/database.module';
import { HttpModule } from '@nestjs/axios';
import { SoltrackerController } from './soltracker.controller';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
    MongooseModule.forFeature([{ name: Call.name, schema: CallSchema }]),
  ],
  providers: [SoltrackerService],
  exports: [SoltrackerService],
  controllers: [SoltrackerController],
})
export class SoltrackerModule {}
