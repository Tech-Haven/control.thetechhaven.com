const { updateSSHKey } = require('../utils/utils')
const User = require('../models/User')

module.exports = {
  name: 'update-ssh',
  description: 'Update your ssh key on the lab. For more information on creating a ssh keypair, see the following forum post: https://forums.thetechhaven.com/t/creating-ssh-key-pair-for-lab/79',
  usage: `<ssh public key>`,
  async execute(message, args) {

    const key = `${args[0]} ${args[1]} ${args[2]}`

    if (!(key)) {
      return message.reply("Please enter your ssh public key!")
    }

    User.findOne({ _id: message.author.id }).populate('lab_user').exec(async (err, user) => {
      if (err) {
        console.error(err);
        return message.reply(`Error!: ${err}`)
      }

      if (!user) {
        return message.reply(`Please login to the lab. Use \`help lab-login\` command for help.`)
      }

      const sshUpdated = await updateSSHKey(user.lab_user.username, user.lab_user.login_token, key)

      if (sshUpdated.error) {
        console.log(sshUpdated)
        return message.reply(`Error!: ${sshUpdated.error}`)
      }

      return message.reply(`SSH key updated!`)
    })
  }
}

