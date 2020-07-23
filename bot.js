const fs = require('fs')
const Discord = require('discord.js');
const { checkIfStaff } = require('./utils/utils')
const { getSSHKey } = require('./utils/lab')
const TicketMessage = require('./models/TicketMessage');
const LabUser = require('./models/LabUser')

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
    client.on('ready', async () => {
      try {
        const ticketMessageDb = await TicketMessage.findOne()
        const ticketMessageChannel = await client.channels.fetch(ticketMessageDb.channelID)
        await ticketMessageChannel.messages.fetch(ticketMessageDb._id)
      } catch (error) {
        console.log("Error!", error)
      }

      console.log(`Logged in as ${client.user.tag}!`)
    })

    // Called when someone joins the guild
    client.on('guildMemberAdd', member => client.commands.get('membercount').update(member.guild))

    // Called when someone leaves the guild
    client.on('guildMemberRemove', member => client.commands.get('membercount').update(member.guild))

    client.on('messageReactionAdd', async (messageReaction, user) => {
      if (!user.bot) {
        try {
          const ticketMessage = await TicketMessage.findOne({ _id: messageReaction.message.id })
          if (ticketMessage) {
            client.commands.get('ticket').sendToDm(messageReaction, user)
          }
        } catch (error) {
          return
        }
      }
    })

    // Called whenever a message is created
    client.on(`message`, async message => {
      // Ignore other bots
      if (message.author.bot) return;

      // Ignore messages without prefix
      if (message.content.indexOf(PREFIX) !== 0) return;

      // Splice "command" away from "arguments"
      const args = message.content.slice(PREFIX.length).trim().split(/ +/g);
      const commandName = args.shift().toLowerCase();
      let props = {};

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

      if (command.labAuth) {
        try {
          const labUser = await LabUser.findOne({ discord_user: message.author.id })

          if (!labUser) {
            return message.reply(`Please login to the lab to use this command. Use \`help lab-login\` command for help.`)
          }

          props.labUser = labUser;
        } catch (error) {
          return message.reply(`Please login to the lab to use this command. Use \`help lab-login\` command for help.`)
        }
      }

      if (command.sshKeyRequired) {
        // Check if user has a SSH key set before creating a VM
        try {
          const labUser = await LabUser.findOne({ discord_user: message.author.id })
          const sshKey = await getSSHKey(labUser.username, labUser.login_token)

          if (!sshKey) {
            return message.reply(`Please save a SSH key to your account before creating a VM. Use the \`help update-ssh\` command for help.`)
          }

          if (sshKey.error) {
            return message.reply(`${sshKey.error} Please save a SSH key to your account before creating a VM. Use the \`help update-ssh\` command for help.`)
          }
        } catch (error) {
          console.error(error)
          return message.reply(`${error} Please save a SSH key to your account before creating a VM. Use the \`help update-ssh\` command for help.`)
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
        command.execute(message, args, props);
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
