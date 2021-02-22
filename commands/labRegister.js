const { labRegister } = require('../utils/lab');

module.exports = {
  name: 'lab-register',
  description: 'Register to the lab server for use with Discord',
  args: true,
  usage: `<password>`,
  disabled: true,
  async execute(message, args) {
    if (!args[0]) {
      return message.reply('Password is required!');
    }

    const username = message.author.id;
    const password = args[0];

    try {
      const status = await labRegister(username, password);

      if (status.error) {
        return message.reply(`Error! ${status.error.msg}`);
      }

      message.reply(
        'Lab account created. Please login with the `lab-login` command.'
      );
    } catch (error) {
      console.error(error);
      message.reply(`Error! ${error}`);
    }
  },
};
