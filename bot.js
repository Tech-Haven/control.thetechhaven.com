const fs = require('fs')
const Discord = require('discord.js');
const { checkIfStaff } = require('./utils/utils')

const client = new Discord.Client();
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  client.commands.set(command.name, command)
}

const BOT_TOKEN = process.env.BOT_TOKEN;
const PREFIX = process.env.PREFIX;

const startBot = async () => {
  try {
    // Called when the server starts
    client.on('ready', () => {
      console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on('guildMemberAdd', member => {
      client.commands.get('membercount').update(member.guild)
    })

    client.on('guildMemberRemove', member => {
      client.commands.get('membercount').update(member.guild)
    })

    // Called whenever a message is created
    client.on(`message`, message => {
      // Ignore other bots
      if (message.author.bot) return;

      // Ignore messages without prefix
      if (message.content.indexOf(PREFIX) !== 0) return;

      // Splice "command" away from "arguments"
      const args = message.content.slice(PREFIX.length).trim().split(/ +/g);
      const commandName = args.shift().toLowerCase();

      if (!client.commands.has(commandName)) return

      const command = client.commands.get(commandName);

      if (command.guildOnly && message.channel.type !== 'text') {
        return message.reply(`I can't execute that command inside DMs!`)
      }

      if (command.staffOnly) {
        const isStaff = checkIfStaff(message.author.id)
        if (!isStaff) {
          return message.reply(`You don't have permission to use this command!`)
        }
      }

      if (command.args && !args.length) {
        let reply = `${message.author}, you didn't provide any arguments!`

        if (command.usage) {
          reply += `\nThe correct usage would be: \`${PREFIX}${command.name} ${command.usage}\``
        }

        return message.reply(reply)
      }

      try {
        command.execute(message, args);
      } catch (e) {
        console.log(e)
        message.reply('Oops! There was an error trying to run that command!')
      }
    });

    client.login(BOT_TOKEN);
  } catch (err) {
    console.error(`Bot failed to start`, error);
    process.exit(1);
  }
};

module.exports = startBot;
