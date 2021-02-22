const { getAllVmInfo } = require('../utils/lab');

module.exports = {
  name: 'show-all-vms',
  description: 'Get info from all VMs owned by the user',
  labAuth: true,
  disabled: true,
  async execute(message, args, props) {
    try {
      const { labUser } = props;

      const vmObject = await getAllVmInfo(
        labUser.username,
        labUser.login_token,
        args[0]
      );

      if (vmObject.error) {
        console.log(vmObject);
        return message.reply(`Error!: ${vmObject}`);
      }

      if (!vmObject.VM_POOL) {
        return message.reply(`No VMs found. Please create a VM first.`);
      }

      const fields = vmObject.VM_POOL.VM.map((vm) => {
        let status;
        switch (vm.STATE[0]) {
          case '0':
            status = 'INIT';
            color = '4DBBD3';
            break;
          case '1':
            status = 'PENDING';
            color = '4DBBD3';
            break;
          case '2':
            status = 'HOLD';
            color = '4DBBD3';
            break;
          case '3':
            status = 'ACTIVE';
            color = '3adb76';
            break;
          case '4':
            status = 'STOPPED';
            color = 'ffa07a';
            break;
          case '5':
            status = 'SUSPENDED';
            color = 'ffa07a';
            break;
          case '6':
            status = 'DONE';
            color = '4DBBD3';
            break;
          case '8':
            status = 'POWEROFF';
            color = 'ffa07a';
            break;
          case '9':
            status = 'UNEPLOYED';
            color = '4DBBD3';
            break;
          case '10':
            status = 'CLONING';
            color = '4DBBD3';
            break;
          case '11':
            status = 'CLONING_FAILURE';
            color = 'ffa07a';
            break;
          default:
            status = 'UNKNOWN';
            color = '4DBBD3';
            break;
        }
        return [
          {
            name: 'ID',
            value: `${vm.ID[0]}`,
            inline: true,
          },
          {
            name: 'IP Address',
            value: `${vm.TEMPLATE[0].NIC[0].IP[0]}`,
            inline: true,
          },
          {
            name: 'Status',
            value: status,
            inline: true,
          },
        ];
      });

      message.channel.send({
        embed: {
          title: `${message.author.username}'s VMs`,
          fields: fields,
        },
      });
    } catch (error) {
      console.error(error);
      message.reply(`Error! ${error}`);
    }
  },
};
