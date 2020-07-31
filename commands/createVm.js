const { createVm, getVmInfo, getTemplateInfo, getTemplateFields } = require('../utils/lab')

const timeoutTime = 30000

module.exports = {
  name: 'create-vm',
  description: 'Get info from a VM on the Lab server',
  usage: `<templateID> <VM name>`,
  labAuth: true,
  sshKeyRequired: true,
  async execute(message, args, props) {

    try {
      const { labUser } = props;

      const templatesObject = await getTemplateInfo(labUser.username, labUser.login_token)

      if (templatesObject.error) {
        console.error(templatesObject.error)
        return message.reply(`Error! ${templatesObject.error}`)
      }

      const fields = getTemplateFields(templatesObject)
      const { idField } = fields
      let templateId
      let vmName

      if (!args[0] && !args[1]) {
        try {
          templateId = await waitForTemplate(message, message.author, fields)

          if (templateId.error) {
            return
          }

          vmName = await waitForName(message, message.author)

          if (vmName.error) {
            return
          }
        } catch (error) {
          console.error(error)
          return message.reply(`Error! ${error}`)
        }
      } else {
        // They didn't type a number or valid template ID
        if (!idField.trim().split("\n").includes(args[0])) {
          return message.reply("Please type a valid template ID")
        }

        // They typed a template ID, but no name
        if (args[0] && !args[1]) {
          args[1] = `${message.author.username} VM`
        }

        templateId = args[0]
        vmName = args[1]
      }

      if (templateId.error || vmName.error) {
        return
      }

      const createdVmId = await createVm(labUser.username, labUser.login_token, templateId, vmName)

      if (createdVmId.error) {
        console.log(createdVmId.error)
        return message.reply(`Error!: ${createdVmId.error.msg}`)
      }

      const vmObject = await getVmInfo(labUser.username, labUser.login_token, createdVmId);

      if (vmObject.error) {
        console.log(vmObject.error)
        return message.reply(`Error!: ${vmObject.error.msg}`)
      }

      let status;
      switch (vmObject.VM.STATE[0]) {
        case '0':
          status = 'INIT'
          color = '4DBBD3'
          break;
        case '1':
          status = 'PENDING'
          color = '4DBBD3'
          break;
        case '2':
          status = 'HOLD'
          color = '4DBBD3'
          break;
        case '3':
          status = 'ACTIVE'
          color = '3adb76'
          break;
        case '4':
          status = 'STOPPED'
          color = 'ffa07a'
          break;
        case '5':
          status = 'SUSPENDED'
          color = 'ffa07a'
          break;
        case '6':
          status = 'DONE'
          color = '4DBBD3'
          break;
        case '8':
          status = 'POWEROFF'
          color = 'ffa07a'
          break;
        case '9':
          status = 'UNEPLOYED'
          color = '4DBBD3'
          break;
        case '10':
          status = 'CLONING'
          color = '4DBBD3'
          break;
        case '11':
          status = 'CLONING_FAILURE'
          color = 'ffa07a'
          break;
        default:
          status = 'UNKNOWN'
          color = '4DBBD3'
          break;
      }
      message.channel.send(`VM created!`)
      return message.channel.send({
        embed: {
          color: color,
          title: `${vmObject.VM.ID[0]} - ${vmObject.VM.NAME[0]}`,
          description: `VM running on Tech Haven lab`,
          fields: [
            {
              name: "Name",
              value: vmObject.VM.NAME[0],
              inline: true
            },
            {
              name: "Image",
              value: vmObject.VM.TEMPLATE[0].DISK[0].IMAGE[0],
              inline: true
            },
            {
              name: "Status",
              value: status,
              inline: true
            },
            {
              name: "CPU",
              value: vmObject.VM.TEMPLATE[0].CPU[0],
              inline: true
            },
            {
              name: "Memory",
              value: `${vmObject.VM.TEMPLATE[0].MEMORY[0]} MB`,
              inline: true
            },
            {
              name: "IP Address",
              value: vmObject.VM.TEMPLATE[0].NIC[0].IP[0],
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

// Ask for template ID, wait, and return the user's response
const waitForTemplate = async (message, user, fields) => {
  const askForTemplateMessage = await message.reply("What template do you want to spawn? (type the ID)")
  const { idField, nameField } = fields
  let chooseTemplateEmbedMessage
  try {
    chooseTemplateEmbedMessage = await message.channel.send({
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
  } catch (err) {
    console.error(error)
    return message.reply(`Error! ${error}`)
  }
  const filter = m => {
    return m.author.id === user.id && idField.trim().split("\n").includes(m.content)
  }
  try {
    const reply = await message.channel.awaitMessages(filter, { max: 1, time: timeoutTime, errors: ['time'] })

    const templateReply = reply.first().content.trim().toLowerCase()
    await askForTemplateMessage.delete()
    await chooseTemplateEmbedMessage.delete()
    return templateReply;
  } catch (error) {
    await askForTemplateMessage.delete()
    await chooseTemplateEmbedMessage.delete()
    message.reply(`Command timed out. Goodbye!`)
    return { error }
  }
}

const waitForName = async (message, user) => {
  const askForNameMessage = await message.reply("What do you wanna call your VM?")

  const filter = m => m.author.id === user.id

  try {
    const reply = await message.channel.awaitMessages(filter, { max: 1, time: timeoutTime, errors: ['time'] })

    const nameReply = reply.first().content.trim().toLowerCase()
    if (nameReply === '') {
      nameReply = `${message.author.username}'s VM`
    }
    await askForNameMessage.delete()
    return nameReply;
  } catch (error) {
    message.reply(`Command timed out. Goodbye!`)
    await askForNameMessage.delete()
    return { error }
  }
}

