const { checkForLoginToken } = require('../utils/utils')
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

    // Verify lab user
    const login_token = await checkForLoginToken(username, password)

    if (!login_token) {
      return message.reply("Invalid user login!")
    }

    if (login_token.error) {
      return message.reply(`Error!: ${login_token.error.msg}`)
    }

    let lab_user = await LabUser.findOne({ username, login_token })

    User.findOneAndUpdate({ _id: message.author.id }, { lab_user }, { upsert: true, new: true }).populate('lab_user').exec((err, user) => {
      if (err) {
        console.error(err);
        return message.reply(`Error!: ${err}`)
      }
      return message.reply(`Successfully logged in!`)
    })
  }
}
