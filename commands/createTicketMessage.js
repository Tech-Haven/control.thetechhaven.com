const Discord = require('discord.js')
const TicketMessage = require('../models/TicketMessage');

module.exports = {
  name: 'create-ticket-message',
  description: 'Creates the "Create a ticket" message, and reacts',
  staffOnly: true,
  async execute(message, args) {
    message.reply("What channel do you want to post in?")
    waitForChannel(message)
  }
}

const waitForChannel = (message) => {
  const channelCollector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 10000 });

  channelCollector.on('collect', async reply => {
    try {
      const replyChannelId = reply.content.replace(/<|#|>/g, '')
      const fetchedChannel = await message.client.channels.fetch(replyChannelId)
      message.reply(`Okay! Sending my 'ticket react' message to ${fetchedChannel}`)
      sendTicketMessage(fetchedChannel);
    } catch (error) {
      message.reply(`Hmm, that channel doesn't seem valid. Try tagging the channel again.`)
      waitForChannel(message)
    }
  })
}

// Create the message in the channel specified. Save message ID to database for reference when someone reacts.
const sendTicketMessage = async channel => {
  try {
    const message = await channel.send({
      embed: {
        title: 'Help Desk',
        description: 'React below to open a new help desk ticket',
      }
    })
    message.react('✅') // :white_check_mark: unicode may not render on some systems.

    const query = { _id: message.id, channelID: channel.id }
    await TicketMessage.findOneAndUpdate(query, query, {
      upsert: true,
      new: true
    })
  } catch (error) {
    console.error('createTicketMessage:sendTicketMessage' + error)
  }
}

