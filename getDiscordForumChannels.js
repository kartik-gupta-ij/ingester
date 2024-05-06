const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const channelId = process.env.CHANNEL_ID;
const token = process.env.BOT_TOKEN;

client.once("ready", async () => {
  console.log("Bot is ready");

  const channel = await client.channels.fetch(channelId);

  if (!channel) {
    console.error("Channel not found");
    return;
  }

  const threads = await channel.threads.fetch();

  const messagesArray = [];
  for (const thread of threads.threads.values()) {
    const messages = await thread.fetchStarterMessage();

    messagesArray.push(`${thread.name}- ${messages.content} `);
  }

    fs.writeFileSync("threads.json", JSON.stringify(messagesArray, null, 2));
});

client.login(token);