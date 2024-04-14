import { EmbedBuilder, Client, TextChannel } from "discord.js";

import { Command } from '../../types';

const logEmbedSend = async (client: Client, command: string, channelId: string, userId: string, msg: string) => {
    const logEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setDescription(`Command \`${client.config.bot.prefix}msg ${command} ${msg}\``)
        .addFields(
            { name: 'Client', value: `<@${userId}>` },
            { name: 'Target Channel', value: `<#${channelId}>` },
        )

    const logChan = client.channels.cache.get(client.config.bot.logchan) as TextChannel;
    if (!logChan) return client.logger.error('Log channel not found!');
    logChan.send({ embeds: [logEmbed] });
}

const command: Command = {
    name: 'msg',
    description: "Sends a message to a channel.",
    cooldown: 1000,
    owner: false,
    userPerms: ['ModerateMembers'],
    botPerms: ['Administrator'],
    async execute(client, message, args) {

        var chan = message.mentions.channels.first() as TextChannel;
        var msg;

        if (!chan) {
            chan = message.channel as TextChannel;
            msg = args.join(" ");
        } else {
            msg = args.slice(1).join(" ");
        }

        if (!msg) return message.reply({ content: 'No message!' });

        if (msg.length > 1500) {
            const chunks = msg.match(/[\s\S]{1,1500}/g) || [];

            try {
                for (const chunk of chunks) {
                    await chan.send({ content: chunk });
                }
                await logEmbedSend(client, 'message', chan.id, message.author.id, msg);
            } catch (error) {
                client.logger.error(error);
                message.reply({ content: 'An error occurred while sending the message. Please try again later.' });
            }
        } else {
            try {
                await chan.send({ content: `${msg}` });
                await logEmbedSend(client, 'message', chan.id, message.author.id, msg);
            } catch (error) {
                client.logger.error(error);
                message.reply({ content: 'An error occurred while sending the message. Please try again later.' });
            }
        }
        await message.delete();
    }
}

export default command;