export class saveTokenDTO {
  tokenContractAddress: string;
  swapSignatures: string[];
  name: string;
  symbol: string;
  swapsCount: string;
  tokenAge: string;
  tokenBalance: string;
  firstBuyTime: string;
  alertBuyTime: string;
}

// async getTokenMetadata() {
//   const connection = new Connection('https://api.mainnet-beta.solana.com');
//   const metaplex = Metaplex.make(connection);

//   const mintAddress = new PublicKey(
//     '8uSJ2W7MRStD4eDqGNJBhZPvTXRFUUeuPjpod6XJpump',
//   );

//   let tokenName;
//   let tokenSymbol;
//   let tokenLogo;

//   const metadataAccount = metaplex
//     .nfts()
//     .pdas()
//     .metadata({ mint: mintAddress });

//   const metadataAccountInfo =
//     await connection.getAccountInfo(metadataAccount);

//   if (metadataAccountInfo) {
//     const token = await metaplex
//       .nfts()
//       .findByMint({ mintAddress: mintAddress });
//     tokenName = token.name;
//     tokenSymbol = token.symbol;
//     tokenLogo = token.address.toString();

//     console.log(tokenName, tokenSymbol, tokenLogo);
//   }
// }
