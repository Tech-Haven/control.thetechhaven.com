const { generateVPNFile } = require('../utils/utils')

module.exports = {
  name: 'generate-vpn',
  description: 'Create a VPN file to access the lab',
  async execute(message, args) {

    try {

      const status = await generateVPNFile(message.author.id)

      if (status.error) {
        console.log(status.error)
        return message.reply(`Error!: ${status.error.msg}`)
      }
      return message.reply(status.download)

    } catch (error) {
      console.error(error)
      message.reply(`Error! ${error}`)
    }
  }
}

