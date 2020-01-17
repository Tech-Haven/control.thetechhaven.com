const Discord = require('discord.js');
const moment = require('moment');
const client = new Discord.Client();

const BOT_TOKEN = process.env.BOT_TOKEN;
const PREFIX = process.env.PREFIX;
const GUILD_ID = process.env.GUILD_ID;

const startBot = async () => {
  try {
    // Called when the server starts
    client.on('ready', () => {
      console.log(`Logged in as ${client.user.tag}!`);
    });

    // Called whenever a message is created
    client.on(`message`, async message => {
      // Ignore other bots
      if (message.author.bot) return;

      // Ignore messages without prefix
      if (message.content.indexOf(PREFIX) !== 0) return;

      // Splice "command" away from "arguments"
      const args = message.content
        .slice(PREFIX.length)
        .trim()
        .split(/ +/g);
      const command = args.shift().toLowerCase();

      if (command === 'profile') {
        const cmd_id = args.join('');
        const user = await client.fetchUser(cmd_id);
        const createdAt = moment(user.createdAt).format('MMM Do YYYY, H:mm:ss');
        const createdAtFromNow = moment(user.createdAt).fromNow();
        const guild = await client.guilds.get(GUILD_ID);
        const guildMember = await guild.member(user);
        console.log(user.avatarURL);
        console.log(user.defaultAvatarURL);

        if (guildMember) {
          const joinedAt = moment(guildMember.joinedAt).format(
            'MMM Do YYYY, H:mm:ss'
          );
          const joinedAtFromNow = moment(guildMember.joinedAt).fromNow();
          message.channel.send({
            embed: {
              color: 3447003,
              title: 'User Profile',
              description: `User data for <@${user.id}>`,
              thumbnail: {
                url: user.avatarURL ? user.avatarURL : user.defaultAvatarURL
              },
              fields: [
                {
                  name: 'Username',
                  value: user.tag,
                  inline: true
                },
                {
                  name: 'ID',
                  value: user.id,
                  inline: true
                },
                {
                  name: 'Status',
                  value: guildMember.presence.status,
                  inline: true
                },
                {
                  name: 'Highest Role',
                  value: guildMember.highestRole.name,
                  inline: true
                },
                {
                  name: 'Created',
                  value: `${createdAt} 
                  (${createdAtFromNow})`,
                  inline: true
                },
                {
                  name: 'Joined',
                  value: `${joinedAt}
                  (${joinedAtFromNow})`,
                  inline: true
                }
              ],
              timestamp: new Date()
            }
          });
        } else {
          message.channel.send({
            embed: {
              color: 3447003,
              title: 'User Profile',
              description: `User data for <@${user.id}>`,
              thumbnail: {
                url: user.avatarURL ? user.avatarURL : user.defaultAvatarURL
              },
              fields: [
                {
                  name: 'Username',
                  value: user.tag,
                  inline: true
                },
                {
                  name: 'ID',
                  value: user.id,
                  inline: true
                },
                {
                  name: 'Created',
                  value: `${createdAt} 
                  (${createdAtFromNow})`,
                  inline: true
                }
              ],
              timestamp: new Date()
            }
          });
        }
      }
    });

    client.login(BOT_TOKEN);
  } catch (err) {
    console.error(`Bot failed to start`, error);
    process.exit(1);
  }
};

module.exports = startBot;
