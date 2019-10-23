const Discord = require('discord.js');
const client = new Discord.Client();

const BOT_TOKEN = process.env.BOT_TOKEN;
const PREFIX = process.env.PREFIX;

const startBot = async () => {
  try {
    client.on('ready', () => {
      console.log(`Logged in as ${client.user.tag}!`);
    });

    client.login(BOT_TOKEN);
  } catch (err) {
    console.error(`Bot failed to start`, error);
    process.exit(1);
  }
};

module.exports = startBot;
exports.client = client;
