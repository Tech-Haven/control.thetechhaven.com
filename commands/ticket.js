const yparse = require('yargs-parser')
const Discord = require('discord.js')
const { createThread } = require('../utils/forum')

const timeoutTime = 300000; // 5 minutes
let ticketObject = {}

module.exports = {
  name: 'ticket',
  description: 'Create a help desk ticket, and send it to the forums',
  guildOnly: true,
  args: true,
  usage: `--title "<title>" --description "<description>"`,
  async sendToDm(messageReaction, user) {
    // Send DM to user asking for ticket information.
    try {
      await user.send(`Thank you for using the Tech Haven ticket system! Keep in mind, I will stop listening for a response after ${timeoutTime / 60000} minutes of inactivity.`)
      await messageReaction.users.remove(user)
    } catch (error) {
      console.error(`Could not send help DM to ${user.username}.\n`, error)
    }
    waitForCategory(user)
  },
  async execute(message, args) {

    const yargs = yparse(args.join(' '))

    console.log(yargs._)

    if (!yargs._.length == 0) {
      return message.reply(`Something is wrong with your request. Please use double quotes (") around your title and description.`)
    }

    if (!yargs.title) {
      return message.reply(`Please enter a title. Usage ${this.usage}`)
    }

    if (!yargs.description) {
      return message.reply(`Please enter a description. Usage ${this.usage}`)
    }

    let nodeID;
    switch (message.channel.name) {
      case 'general-help':
        nodeID = 37;
        break;
      case 'networking-help':
        nodeID = 9;
        break;
      case 'windows-help':
        nodeID = 10;
        break;
      case 'linux_unix-help':
        nodeID = 11;
        break;
      case 'programming-help':
        nodeID = 12;
        break;
      case 'cybersecurity-help':
        nodeID = 13;
        break;
      case 'electronics-help':
        nodeID = 14;
        break;
      default:
        nodeID = 37;
        break;
    }

    const title = yargs.title
    const description = `${yargs.description}

    
    Ticket created by ${message.author.username}#${message.author.discriminator}`

    createThread(nodeID, title, description)

    return message.reply(`Ticket created!`)
  }
}

const waitForCategory = user => {
  categories = ['general', 'cybersecurity', 'electronics', 'networking', 'linux', 'programming', 'servers', 'windows']

  user.send(`Type one of the categories listed that best fits your question. ${categories.join(', ')}`)

  const categoryCollector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { time: timeoutTime })

  categoryCollector.on('collect', async reply => {
    try {
      const ticketCategory = reply.content.trim().toLowerCase()
      if (ticketCategory === '') {
        categoryCollector.stop()
        waitForCategory(user)
      }

      let nodeID;
      switch (reply.content) {
        case 'general':
          nodeID = 37;
          break;
        case 'networking':
          nodeID = 9;
          break;
        case 'windows':
          nodeID = 10;
          break;
        case 'linux':
          nodeID = 11;
          break;
        case 'programming':
          nodeID = 12;
          break;
        case 'cybersecurity':
          nodeID = 13;
          break;
        case 'electronics':
          nodeID = 14;
          break;
        case 'servers':
          nodeID = 15;
          break;
        default:
          user.send(`Since that's not a category, we'll just go with general then...`)
          nodeID = 37;
          break;
      }
      ticketObject.nodeID = nodeID;
      categoryCollector.stop()
      waitForTitle(user)
    } catch (error) {
      return user.send(`Error! ${error}`)
    }
  })
}

const waitForTitle = user => {
  user.send(`Please give a short summary of your issue. This will be used as the the "Thread Title" on the forums...`)

  const titleCollector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { time: timeoutTime })

  titleCollector.on('collect', async reply => {
    try {
      const ticketTitle = reply.content.trim();
      if (ticketTitle === '') {
        titleCollector.stop()
        waitForTitle(user);
      }
      ticketObject.title = ticketTitle;
      titleCollector.stop()
      waitForDescription(user)
    } catch (error) {
      return user.send(`Error! ${error}`)
    }
  })
}

const waitForDescription = user => {
  user.send(`Please give a description of your issue. This should include any details of the problem. (2000 character limit because of Discord)`)

  const descriptionCollector = user.dmChannel.createMessageCollector(m => m.author.id === user.id, { time: timeoutTime })

  descriptionCollector.on('collect', async reply => {
    try {
      const ticketDescription = reply.content.trim();
      if (ticketDescription === '') {
        descriptionCollector.stop()
        waitForDescription(user);
      }
      ticketObject.description = `${ticketDescription}
      
      
      Ticket created by ${user.username}#${user.discriminator}`
      descriptionCollector.stop()
      sendTicketToForums(user, ticketObject)
    } catch (error) {
      return user.send(`Error! ${error}`)
    }
  })
}

const sendTicketToForums = (user, ticketObject) => {
  const { nodeID, title, description } = ticketObject;
  createThread(nodeID, title, description)
  return user.send(`Ticket created! Check the help desk category in Discord for confirmation.`)
}