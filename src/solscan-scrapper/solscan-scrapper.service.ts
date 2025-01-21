import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-core';
@Injectable()
export class SolscanScrapperService {
  constructor() {}

  async getTokenDetails(mint: string) {
    console.log('called');
    const browser = await puppeteer.connect({
      browserWSEndpoint: process.env.SBR_WS_ENDPOINT,
    });

    try {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(2 * 60 * 1000);
      await Promise.all([
        page.waitForNavigation(),
        page.goto(`https://solscan.io/token/${mint}`),
      ]);

      console.log(page);
      return await page.$$eval(
        '#__next > div.flex.flex-col.gap-0.items-stretch.justify-start.h-full.min-h-screen > div.w-full.flex-1 > div.my-0.mx-auto.max-w-full.px-4.md\\:px-6.\\32 xl\\:px-0.\\32 xl\\:max-w-\\[1400px\\] > div.flex.flex-col.gap-6.items-stretch.justify-start.w-full > div.flex.flex-col.gap-6.items-stretch.justify-start.w-full',
        (resultItems) => {
          return resultItems.map((resultItem) => {
            const tokenName = resultItem.querySelector(
              '#__next > div.flex.flex-col.gap-0.items-stretch.justify-start.h-full.min-h-screen > div.w-full.flex-1 > div.my-0.mx-auto.max-w-full.px-4.md\\:px-6.\\32 xl\\:px-0.\\32 xl\\:max-w-\\[1400px\\] > div.flex.flex-col.gap-6.items-stretch.justify-start.w-full > div.flex.flex-col.gap-6.items-stretch.justify-start.w-full > div.flex.flex-row.flex-wrap.justify-start.grow-0.shrink-0.basis-full.min-w-0.box-border.gap-y-4.-mx-1\\.5.items-stretch > div:nth-child(2) > div > div.flex.flex-col.gap-2.items-start.justify-start > div:nth-child(1) > div.max-w-24\\/24.md\\:max-w-14\\/24.flex-24\\/24.md\\:flex-14\\/24.block.relative.box-border.my-0.px-1 > div',
            )?.textContent;
            const decimal = resultItem.querySelector(
              '#__next > div.flex.flex-col.gap-0.items-stretch.justify-start.h-full.min-h-screen > div.w-full.flex-1 > div.my-0.mx-auto.max-w-full.px-4.md\\:px-6.\\32 xl\\:px-0.\\32 xl\\:max-w-\\[1400px\\] > div.flex.flex-col.gap-6.items-stretch.justify-start.w-full > div.flex.flex-col.gap-6.items-stretch.justify-start.w-full > div.flex.flex-row.flex-wrap.justify-start.grow-0.shrink-0.basis-full.min-w-0.box-border.gap-y-4.-mx-1\\.5.items-stretch > div:nth-child(2) > div > div.flex.flex-col.gap-2.items-start.justify-start > div:nth-child(2) > div.max-w-24\\/24.md\\:max-w-14\\/24.flex-24\\/24.md\\:flex-14\\/24.block.relative.box-border.my-0.px-1 > div',
            )?.textContent;
            const firstMintDate = resultItem.querySelector(
              '#__next > div.flex.flex-col.gap-0.items-stretch.justify-start.h-full.min-h-screen > div.w-full.flex-1 > div.my-0.mx-auto.max-w-full.px-4.md\\:px-6.\\32 xl\\:px-0.\\32 xl\\:max-w-\\[1400px\\] > div.flex.flex-col.gap-6.items-stretch.justify-start.w-full > div.flex.flex-col.gap-6.items-stretch.justify-start.w-full > div.flex.flex-row.flex-wrap.justify-start.grow-0.shrink-0.basis-full.min-w-0.box-border.gap-y-4.-mx-1\\.5.items-stretch > div:nth-child(2) > div > div.flex.flex-col.gap-2.items-start.justify-start > div:nth-child(5) > div.max-w-24\\/24.md\\:max-w-14\\/24.flex-24\\/24.md\\:flex-14\\/24.block.relative.box-border.my-0.px-1 > button > div > div > div',
            ).textContent;
            return {
              tokenName,
              decimal,
              firstMintDate,
            };
          });
        },
      );
    } finally {
      await browser.close();
    }
  }
}
