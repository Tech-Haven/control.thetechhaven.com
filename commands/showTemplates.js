const { getTemplateInfo, getTemplateFields } = require('../utils/lab');

module.exports = {
  name: 'show-templates',
  description: 'Show different templates available to spawn.',
  labAuth: true,
  disabled: true,
  async execute(message, args, props) {
    try {
      const { labUser } = props;

      const templatesObject = await getTemplateInfo(
        labUser.username,
        labUser.login_token
      );

      if (templatesObject.error) {
        console.error(templatesObject.error);
        return message.reply(`Error! ${templatesObject.error}`);
      }

      const fields = getTemplateFields(templatesObject);
      const { idField, nameField } = fields;

      return message.channel.send({
        embed: {
          title: `VM Templates`,
          description: `VM Templates to spawn`,
          fields: [
            {
              name: 'ID',
              value: `${idField}`,
              inline: true,
            },
            {
              name: 'Distro',
              value: `${nameField}`,
              inline: true,
            },
          ],
        },
      });
    } catch (error) {
      console.error(error);
      message.reply(`Error! ${error}`);
    }
  },
};
