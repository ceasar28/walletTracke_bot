import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type UserDocument = mongoose.HydratedDocument<Token>;

@Schema()
export class Token {
  @Prop()
  tokenContractAddress: string;
  @Prop()
  tokenPairContractAddress: string;
  @Prop()
  swapHashes: string[];
  @Prop()
  name: string;
  @Prop()
  swapsCount: number;
  @Prop()
  tokenPairAge: string;
  @Prop()
  firstBuyHash: string;
  @Prop()
  firstBuyTime: string;
  @Prop()
  twentiethBuyHash: string;
  @Prop()
  twentiethBuyTime: string;
  @Prop()
  symbol: string;
  @Prop()
  decimal: string;
  @Prop()
  from: string;
  @Prop()
  to: string;
  @Prop()
  tokenAge: string;
}

@Schema()
export class User {
  @Prop({ unique: true })
  userChatId: number;
}

export const TokenSchema = SchemaFactory.createForClass(Token);

export const UserSchema = SchemaFactory.createForClass(User);
