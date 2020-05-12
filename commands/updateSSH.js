const { updateSSHKey } = require('../utils/utils')
const LabUser = require('../models/LabUser')

module.exports = {
  name: 'update-ssh',
  description: 'Update your ssh key on the lab. For more information on creating a ssh keypair, see the following forum post: https://forums.thetechhaven.com/t/creating-ssh-key-pair-for-lab/79',
  usage: `<ssh public key>`,
  async execute(message, args) {

    const key = `${args[0]} ${args[1]} ${args[2]}`

    if (!(key)) {
      return message.reply("Please enter your ssh public key!")
    }

    try {
      const labUser = await LabUser.findOne({ discord_user: message.author.id })

      if (!labUser) {
        return message.reply(`Please login to the lab. Use \`help lab-login\` command for help.`)
      }

      const sshUpdated = await updateSSHKey(labUser.username, labUser.login_token, key)

      if (sshUpdated.error) {
        console.log(sshUpdated)
        return message.reply(`Error!: ${sshUpdated.error}`)
      }

      return message.reply(`SSH key updated!`)

    } catch (error) {
      console.error(error)
      message.reply(`Error! ${error}`)
    }

  }
}

