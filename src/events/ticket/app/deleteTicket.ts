import { Events } from "discord.js";
import { config } from "dotenv";
import path from "path";

import { BotEvent, ITicketLog } from '../../../types';
import ticketGuildModel from "../../database/schema/ticketGuild";
import ticketUserModel from "../../database/schema/ticketUser";
import { deleteTicketLog } from "../../../utils/ticket/ticketFunction";
import { deleteTicketEmbedandClient, deleteTicketReasonModal, deleteTicketSpam } from "../../../utils/ticket/ticketEmbed";

const buttonCooldown = new Set();
config();

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        const ticketLogDir = path.join(__dirname, '../../website/ticket-logs');
        const serverAdd = `${process.env.SERVERADD}`;

        if (interaction.customId == "delete-ticket") {

            await interaction.deferReply({ ephemeral: true });

            const ticketUser = await ticketUserModel.findOne({
                'ticketlog.ticketId': interaction.channel.id
            }).catch(err => client.logger.error(err));

            const ticketGuild = await ticketGuildModel.findOne({
                guildId: interaction.guild.id
            }).catch(err => client.logger.error(err));

            if (buttonCooldown.has(interaction.user.id)) {
                await deleteTicketSpam(client, interaction);
            } else {
                buttonCooldown.add(interaction.user.id);

                const guild = client.guilds.cache.get(interaction.guildId);
                const chan = guild.channels.cache.get(interaction.channelId);
                if (chan == null) return;

                await interaction.editReply({
                    content: 'Saving Messages and Deleting the channel ...',
                    ephemeral: true
                });

                await deleteTicketLog(client, interaction, ticketLogDir, chan, "no-image-save");

                const matchingEntry = ticketUser.ticketlog.find((ticket: ITicketLog) => ticket.ticketId === interaction.channel.id);

                if (matchingEntry) {
                    matchingEntry.transcriptLink = `${serverAdd}/transcript-${interaction.channel.id}.html`;
                    matchingEntry.activeStatus = false;
                    await ticketUser.save();

                    await deleteTicketEmbedandClient(client, interaction, ticketUser, ticketGuild, serverAdd, chan, null);

                    setTimeout(async () => {
                        chan.delete()
                            .catch((error: Error | any) => {
                                if (error.code == 10003) {
                                    return; //channel not found error
                                }
                            });
                    }, 2000);
                }
                setTimeout(() => buttonCooldown.delete(interaction.user.id), 2000);
            }
        }

        if (interaction.customId == "delete-ticket-reason") {
            await deleteTicketReasonModal(client, interaction);
        }

        if (interaction.customId == "ticket-reason-modal") {

            await interaction.deferReply({ ephemeral: true });

            const ticketUser = await ticketUserModel.findOne({
                'ticketlog.ticketId': interaction.channel.id
            }).catch(err => client.logger.error(err));

            const ticketGuild = await ticketGuildModel.findOne({
                guildId: interaction.guild.id
            }).catch(err => client.logger.error(err));

            if (buttonCooldown.has(interaction.user.id)) {
                await deleteTicketSpam(client, interaction);
            } else {
                buttonCooldown.add(interaction.user.id);

                const TicketReason = interaction.fields.getTextInputValue('ticket-reason-modal-text');

                const guild = client.guilds.cache.get(interaction.guildId);
                const chan = guild.channels.cache.get(interaction.channelId);
                if (chan == null) return;

                await interaction.editReply({
                    content: 'Saving Messages and Deleting the channel ...',
                    ephemeral: true
                });

                await deleteTicketLog(client, interaction, ticketLogDir, chan, "no-image-save");

                const matchingEntry = ticketUser.ticketlog.find((ticket: ITicketLog) => ticket.ticketId === interaction.channel.id);

                if (matchingEntry) {
                    matchingEntry.transcriptLink = `${serverAdd}/transcript-${interaction.channel.id}.html`;
                    matchingEntry.activeStatus = false;
                    await ticketUser.save();

                    await deleteTicketEmbedandClient(client, interaction, ticketUser, ticketGuild, serverAdd, chan, TicketReason);

                    setTimeout(async () => {
                        chan.delete()
                            .catch((error: Error | any) => {
                                if (error.code == 10003) {
                                    return; //channel not found error
                                }
                            });
                    }, 2000);
                }
                setTimeout(() => buttonCooldown.delete(interaction.user.id), 2000);
            }
        }
    }
}

export default event;