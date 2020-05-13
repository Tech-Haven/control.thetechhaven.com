const { getTemplateInfo } = require('../utils/utils')
const LabUser = require('../models/LabUser')

module.exports = {
  name: 'show-templates',
  description: 'Show different templates available to spawn.',
  async execute(message, args) {

    try {
      const labUser = await LabUser.findOne({ discord_user: message.author.id })

      if (!labUser) {
        return message.reply(`Please login to the lab. Use \`help lab-login\` command for help.`)
      }

      const templatesObject = await getTemplateInfo(labUser.username, labUser.login_token)

      if (templatesObject.error) {
        console.error(templatesObject.error)
        return message.reply(`Error! ${templatesObject.error}`)
      }

      let idField = ''
      let nameField = ''
      const templates = templatesObject.VMTEMPLATE_POOL.VMTEMPLATE;

      const compare = (a, b) => {
        let comparison = 0;
        if (a.ID[0] > b.ID[0]) {
          comparison = 1;
        } else if (a.ID[0] < b.ID[0]) {
          comparison = -1;
        }
        return comparison
      }

      templates.sort(compare)

      for (let i = 0; i < templates.length; i++) {
        idField += `${templates[i].ID[0]}\n`
        nameField += `${templates[i].NAME[0]}\n`
      }

      return message.channel.send({
        embed: {
          title: `VM Templates`,
          description: `VM Templates to spawn`,
          fields: [
            {
              name: "ID",
              value: `${idField}`,
              inline: true
            },
            {
              name: "Distro",
              value: `${nameField}`,
              inline: true
            }
          ]
        }
      })

    } catch (error) {
      console.error(error)
      message.reply(`Error! ${error}`)
    }

  }
}

