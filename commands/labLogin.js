const { labLogin } = require('../utils/lab')
const User = require('../models/User')
const LabUser = require('../models/LabUser')

module.exports = {
  name: 'lab-login',
  description: 'Login to the lab server for use with Discord',
  args: true,
  usage: `<username> <password>`,
  async execute(message, args) {

    if (!args[0] || !args[1]) {
      return message.reply("Username and password are required!")
    }

    const username = args[0];
    const password = args[1];

    try {
      let discordUser = await User.findOne({ _id: message.author.id })

      // save discord user to the database if they don't exist
      if (!discordUser) {
        newUser = new User({
          _id: message.author.id,
          username: message.author.username,
          discriminator: message.author.discriminator
        })
        newUser = await newUser.save();
        discordUser = newUser
      }

      // Get back labUser from db
      const labUser = await labLogin(username, password);

      // Invalid creds
      if (labUser.error) {
        return message.reply(`Error! ${labUser.error}`)
      }

      // user already logged in before, or another user is trying to log in as them
      if (labUser.discord_user) {
        if (labUser.discord_user == message.author.id) {
          return message.reply(`You already logged in!`)
        } {
          message.reply(`Lab account is already associated with another Discord account. You got caught ;)`)
          // DM the actual owner that someone tried to login to their lab account
          const owner = await message.client.users.fetch(labUser.discord_user)
          return await owner.send(`${message.author} tried signing into your lab account. Reset your password!`)
        }
      }

      // User hasn't associated theirDiscord account yet, so update their labUser to reference discordUser
      const updatedLabUser = await LabUser.findOneAndUpdate({ userID: labUser.userID }, { discord_user: discordUser }, { upsert: true, new: true });

      message.reply(`Success! Discord account is now associated with your lab account.`)

    } catch (error) {
      console.error(error)
      message.reply(`Error! ${error}`)
    }
  }
}
