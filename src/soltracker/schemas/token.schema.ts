import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type UserDocument = mongoose.HydratedDocument<Token>;

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
  firstBuyTime: string;
  @Prop()
  alertBuyTime: string;
  @Prop({ default: false })
  alerted: boolean;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
