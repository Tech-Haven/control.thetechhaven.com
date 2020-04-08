const PREFIX = process.env.PREFIX;

module.exports = {
  name: 'help',
  description: 'List all of my commands or info about a specific command.',
  async execute(message, args) {
    const data = [];
    const { commands } = message.client;

    if (!args.length) {
      data.push(`Here's a list of all my commands:`);
      data.push(commands.map(command => command.name).join(', '));
      data.push(`\nYou can send \`${PREFIX}help [command name]\` to get info on a specific command.`);

      try {
        await message.author.send(data, { split: true })
        if (message.channel.type === 'dm') return;
        message.reply(`I've sent you a DM with all my commands!`)
      } catch (e) {
        console.error(`Could not send help DM to ${message.author.tag}.\n`, e)
        message.reply(`It seems I can't DM you! Do you have DMs disabled?`);
      }
    }

    const name = args[0].toLowerCase();
    const command = commands.get(name);

    if (!command) {
      return message.reply(`That is not a valid command!`)
    }

    data.push(`**Name:** ${command.name}`);

    if (command.description) data.push(`**Description:** ${command.description}`);
    if (command.usage) data.push(`**Usage:** \`${PREFIX}${command.name} ${command.usage}\``);

    message.channel.send(data, { split: true })
  }
}