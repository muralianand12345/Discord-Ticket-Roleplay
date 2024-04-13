import { Events, EmbedBuilder } from "discord.js";
import discordTranscripts from "discord-html-transcripts";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

import ticketGuildModel from "../../database/schema/ticketGuild";
import ticketUserModel from "../../database/schema/ticketUser";
import { BotEvent } from '../../../types';

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        if (interaction.customId == "transcript-ticket") {

            await interaction.deferReply();

            const chan = interaction.channel;

            const ticketGuild = await ticketGuildModel.findOne({
                guildId: interaction.guild.id
            }).catch(err => client.logger.error(err));

            const ticketUser = await ticketUserModel.findOne({
                userId: interaction.user.id
            }).catch(err => client.logger.error(err));

            if (!ticketGuild || !ticketUser) {
                return await interaction.editReply({ content: `Error: No data found, contact the Developer.`, ephemeral: true });
            }

            const htmlCode = await discordTranscripts.createTranscript(chan, {
                limit: -1,
                returnType: 'string' as any,
                filename: `transcript-${chan.id}.html`,
                saveImages: false,
                poweredBy: false
            });

            const ticketLogDir = path.join(__dirname, '../../website/ticket-logs');
            const serverAdd = `${process.env.SERVERADD}`;

            fs.writeFile(`${ticketLogDir}/transcript-${chan.id}.html`, htmlCode as any, function (err) {
                if (err) {
                    client.logger.error(err);
                }
            });

            var userId;
            if (ticketUser) {
                userId = ticketUser.userId;
            }

            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Ticket Transcript', iconURL: client.user.avatarURL() })
                .setDescription(`📰 Logs of the ticket \`${chan.id}\` created by <@!${userId}> and logged by <@!${interaction.user.id}>\n\nLogs: [**Click here to see the logs**](${serverAdd}/transcript-${chan.id}.html)`)
                .setColor('#E67E22')
                .setTimestamp();

            await client.channels.cache.get(ticketGuild.ticketLogId).send({
                embeds: [embed]
            });

            await client.users.cache.get(interaction.user.id).send({
                embeds: [embed]
            }).catch((error: Error | any) => {
                if (error.code == 50007) {
                    client.logger.error(`User: ${interaction.user.id} has disabled DMs. | Ticket [${chan.id}] Transcript: ${serverAdd}/transcript-${chan.id}.html`);
                } else {
                    client.logger.error(error);
                }
            }).then(() => {
                interaction.editReply({ content: `Transcript has been sent to your DMs!` });
            })
        }
    }
}

export default event;