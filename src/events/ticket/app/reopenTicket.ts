import { Events, ComponentType, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, Snowflake, Message } from "discord.js";

import ticketGuildModel from "../../database/schema/ticketGuild";
import ticketUserModel from "../../database/schema/ticketUser";
import { reopenTicketChan } from "../../../utils/ticket/ticketFunction";
import { reopenEmbedEdit } from "../../../utils/ticket/ticketEmbed";
import { BotEvent, ITicketLog } from '../../../types';

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.customId == "reopen-ticket") {
            const channelCreatedTimestamp = interaction.channel.createdTimestamp;
            const thresholdTimestamp = Date.now() - 20 * 60 * 1000;

            if (channelCreatedTimestamp >= thresholdTimestamp) {
                return await interaction.reply({
                    content: "You're unable to reopen a recently created ticket. Please wait for 20 minutes before attempting to do so.",
                    ephemeral: true,
                });
            }

            await interaction.deferReply();

            const ticketUser = await ticketUserModel.findOne({
                'ticketlog.ticketId': interaction.channel.id
            }).catch(err => client.logger.error(err));

            const ticketGuild = await ticketGuildModel.findOne({
                guildId: interaction.guild.id
            }).catch(err => client.logger.error(err));

            if (!ticketUser) return await interaction.editReply({
                content: `Cannot reopen: Ticket not in database!`
            });

            if (!ticketGuild) return await interaction.editReply({
                content: 'Setup is incomplete :('
            });

            const matchingEntry = ticketUser.ticketlog.find((ticket: ITicketLog) => ticket.ticketId === interaction.channel.id);

            if (matchingEntry) {

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('reopen-ticket-yes')
                            .setLabel('Confirm')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('reopen-ticket-no')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Secondary),
                    );

                const verif = await interaction.editReply({
                    content: 'Are you sure you want to reopen the ticket?',
                    components: [row]
                });

                const collector = verif.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 15000
                });

                const userButton = interaction.user.id;

                collector.on('collect', async (i: any) => {

                    await i.deferUpdate();

                    if (i.customId == 'reopen-ticket-yes') {
                        await i.editReply({
                            content: `**Reopening ticket ...** (<@!${userButton}>)`,
                            components: []
                        });
                        matchingEntry.activeStatus = true;
                        await ticketUser.save();

                        setTimeout(async () => {
                            await reopenTicketChan(client, interaction, ticketUser, ticketGuild)
                                .then(async () => {
                                    let message = await interaction.channel.messages.fetch(matchingEntry.ticketPannelId);
                                    if (!message) return;
                                    await reopenEmbedEdit(interaction, message);
                                    collector.stop();
                                });
                        }, 5000);
                    }

                    if (i.customId == 'reopen-ticket-no') {
                        await i.editReply({
                            content: `**Ticket reopen cancelled!** (<@${i.user.id}>)`,
                            components: []
                        });
                        collector.stop();
                    }
                });

                collector.on('end', async (collected: Collection<Snowflake, Message>) => {
                    if (collected.size <= 0) {
                        await interaction.editReply({
                            content: `**Reopening ticket canceled!** (<@!${userButton}>)`,
                            components: []
                        });
                    }
                });
            }
        }
    }
}

export default event;