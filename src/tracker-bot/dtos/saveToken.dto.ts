export class saveTokenDTO {
  tokenContractAddress: string;
  tokenPairContractAddress: string;
  swapHashes: string[];
  name: string;
  swapsCount: string;
  tokenAge: string;
  firstBuyHash?: string;
  twentiethBuyHash?: string;
  firstBuyTime: string;
  twentiethBuyTime: string;
}
