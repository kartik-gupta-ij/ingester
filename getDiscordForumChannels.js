const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const cliProgress = require("cli-progress");
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const channelId = process.env.CHANNEL_ID;
const token = process.env.DISCORD_TOKEN;

async function fetchAllThreads(channel) {
  let allThreads = [];
  let hasMore = true;
  let lastId;

  while (hasMore) {
    const options = lastId ? { before: lastId } : {}; 
    const archivedThreads = await channel.threads.fetchArchived(options);
    const threads = [
      ...archivedThreads.threads.values(),
    ];
    allThreads = allThreads.concat(threads);

    
    if (threads.length === 0) {
      hasMore = false;
    } else {
      lastId = threads[threads.length - 1].id;
    }
  }
  const activeThreads = await channel.threads.fetchActive();
  allThreads = allThreads.concat([...activeThreads.threads.values()]);


  return allThreads;
}

client.once("ready", async () => {
  console.log("Bot is ready");

  const channel = await client.channels.fetch(channelId);

  if (!channel) {
    console.error("Channel not found");
    return;
  }

  const allThreads = await fetchAllThreads(channel);
  console.log(`Found ${allThreads.length} threads`);

  const messagesArray = [];
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(allThreads.length, 0);

  let progress = 0;
  for (const thread of allThreads) {
    try {
      const messages = await thread.fetchStarterMessage();
      messagesArray.push({
        threadId: thread.id,
        name: thread.name,
        messages: messages.content,
      });
    } catch (error) {
      if (error.code === 10008) {
        console.warn(`Message not found for thread ${thread.id}`);
      } else {
        console.error(
          `Failed to fetch message for thread ${thread.id}:`,
          error
        );
      }
    }
    progress++;
    progressBar.update(progress);
  }

  progressBar.stop();
  fs.writeFileSync("threads.json", JSON.stringify(messagesArray, null, 2));
});

client.login(token);
