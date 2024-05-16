import {
  Bot,
  Context,
  webhookCallback,
} from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import {
  I18n,
  I18nFlavor,
} from "https://deno.land/x/grammy_i18n@v1.0.2/mod.ts";
import { DEV } from "../../constants.ts";

// Bot Context
type MyContext = Context & I18nFlavor;

if (!Deno.env.get("TELEGRAM_BOT_E_COMMERCE_DEV_TOKEN")) {
  throw new Error("TELEGRAM_BOT_E_COMMERCE_DEV_TOKEN is not set");
}

if (!Deno.env.get("TELEGRAM_BOT_ETSY_DEV_TOKEN")) {
  throw new Error("TELEGRAM_BOT_ETSY_DEV_TOKEN is not set");
}

if (!Deno.env.get("TELEGRAM_BOT_EBAY_DEV_TOKEN")) {
  throw new Error("TELEGRAM_BOT_EBAY_DEV_TOKEN is not set");
}

if (!Deno.env.get("TELEGRAM_BOT_ALLEGRO_DEV_TOKEN")) {
  throw new Error("TELEGRAM_BOT_ALLEGRO_DEV_TOKEN is not set");
}

if (!Deno.env.get("TELEGRAM_BOT_WALMART_DEV_TOKEN")) {
  throw new Error("TELEGRAM_BOT_WALMART_DEV_TOKEN is not set");
}

if (!Deno.env.get("TELEGRAM_BOT_TOKEN_LOG")) {
  throw new Error("TELEGRAM_BOT_TOKEN_LOG is not set");
}

export const eCommerceDevBot = new Bot<MyContext>(
  Deno.env.get("TELEGRAM_BOT_E_COMMERCE_DEV_TOKEN") || "",
);
export const etsyBot = new Bot<MyContext>(
  Deno.env.get("TELEGRAM_BOT_ETSY_DEV_TOKEN") || "",
);
export const ebayBot = new Bot<MyContext>(
  Deno.env.get("TELEGRAM_BOT_EBAY_DEV_TOKEN") || "",
);
export const allegroBot = new Bot<MyContext>(
  Deno.env.get("TELEGRAM_BOT_ALLEGRO_DEV_TOKEN") || "",
);
export const amazonBot = new Bot<MyContext>(
  Deno.env.get("TELEGRAM_BOT_AMAZON_DEV_TOKEN") || "",
);
export const walmartBot = new Bot<MyContext>(
  Deno.env.get("TELEGRAM_BOT_WALMART_DEV_TOKEN") || "",
);

export const supportChatId = Deno.env.get("SUPPORT_CHAT_ID");
export const babaYagaChatId = Deno.env.get("AI_BABA_YAGA_CHAT_ID");
export const logBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN_LOG");
export const bugCatcherDevBotToken = Deno.env.get(
  "TELEGRAM_BOT_BUG_CATCHER_DEV",
);

// export const botUsername = DEV ? "dao999nft_dev_bot" : "ai_koshey_bot";

export const logBot = new Bot(logBotToken || "");
export const bugCatcherDevBot = new Bot(bugCatcherDevBotToken || "");

export const bugCatcherRequest = async (title: string, data: any) => {
  try {
    if (babaYagaChatId) {
      await logBot.api.sendMessage(
        babaYagaChatId,
        `👾 Error ${title}\n\n${JSON.stringify(data)}`,
      );
    }
  } catch (error) {
    console.log(error, "supportRequest error");
  }
};

export const supportRequest = async (title: string, data: any) => {
  try {
    if (supportChatId) {
      await logBot.api.sendMessage(
        supportChatId,
        `🚀 ${title}\n\n${JSON.stringify(data)}`,
      );
    }
  } catch (error) {
    console.log(error, "supportRequest error");
  }
};

export const handleUpdateECommerceDev = webhookCallback(
  eCommerceDevBot,
  "std/http",
);
export const handleUpdateEtsy = webhookCallback(
  etsyBot,
  "std/http",
);
export const handleUpdateEbay = webhookCallback(
  ebayBot,
  "std/http",
);
export const handleUpdateAllegro = webhookCallback(
  allegroBot,
  "std/http",
);

export const handleUpdateAmazon = webhookCallback(
  amazonBot,
  "std/http",
);

export const handleUpdateWalmart = webhookCallback(
  walmartBot,
  "std/http",
);
