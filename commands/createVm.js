const { createVm, getVmInfo, getSSHKey } = require('../utils/utils')
const User = require('../models/User')

module.exports = {
  name: 'create-vm',
  description: 'Get info from a VM on the Lab server',
  usage: `<templateID> <VM name>`,
  async execute(message, args) {

    if (isNaN(args[0])) {
      return message.reply("Please enter a vmid!")
    }

    User.findOne({ _id: message.author.id }).populate('lab_user').exec(async (err, user) => {
      if (err) {
        console.error(err);
        return message.reply(`Error!: ${err}`)
      }

      // Check if user has a SSH key set before creating a VM
      const sshKey = await getSSHKey(user.lab_user.username, user.lab_user.login_token)

      if (!sshKey) {
        return message.reply(`Please save a SSH key to your account before creating a VM.`)
      }

      const createdVmId = await createVm(user.lab_user.username, user.lab_user.login_token, args[0], args[1])

      if (createdVmId.error) {
        console.log(createdVmId.error)
        return message.reply(`Error!: ${createdVmId.error.msg}`)
      }

      const vmObject = await getVmInfo(user.lab_user.username, user.lab_user.login_token, createdVmId);

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
              value: vmObject.VM.TEMPLATE[0].MEMORY[0],
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
    })
  }
}

