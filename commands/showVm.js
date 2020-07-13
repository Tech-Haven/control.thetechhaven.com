const { getVmInfo } = require('../utils/lab')

module.exports = {
  name: 'show-vm',
  description: 'Get info from a VM on the Lab server',
  labAuth: true,
  async execute(message, args, props) {

    if (isNaN(args[0])) {
      return message.reply("Please enter a vmid!")
    }

    try {
      const { labUser } = props;

      const vmObject = await getVmInfo(labUser.username, labUser.login_token, args[0])

      if (vmObject.error) {
        console.log(vmObject)
        return message.reply(`Error!: ${vmObject}`)
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

      return message.channel.send({
        embed: {
          color: color,
          title: `${vmObject.VM.ID[0]} - ${vmObject.VM.NAME[0]}`,
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

