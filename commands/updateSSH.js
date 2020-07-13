const { updateSSHKey } = require('../utils/lab')

module.exports = {
  name: 'update-ssh',
  description: 'Update your ssh key on the lab. For more information on creating a ssh keypair, see the following forum post: https://thetechhaven.com/threads/creating-ssh-key-pair-for-lab.9/',
  usage: `<ssh public key>`,
  labAuth: true,
  async execute(message, args, props) {

    const key = `${args[0]} ${args[1]} ${args[2]}`

    if (!(key)) {
      return message.reply("Please enter your ssh public key!")
    }

    try {
      const { labUser } = props;

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

