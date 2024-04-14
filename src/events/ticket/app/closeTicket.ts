import { ComponentType, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, Snowflake, Message } from "discord.js";

import ticketGuildModel from "../../database/schema/ticketGuild";
import ticketUserModel from "../../database/schema/ticketUser";
import { closeTicketChan } from "../../../utils/ticket/ticketFunction";
import { closeTicketEmbed, closeTicketEditInt } from "../../../utils/ticket/ticketEmbed";
import { BotEvent } from '../../../types';

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        try {

            if (interaction.customId == "close-ticket") {

                await interaction.deferReply();

                const ticketData = await ticketGuildModel.findOne({
                    guildId: interaction.guild.id
                }).catch(err => client.logger.error(err));

                const ticketUser = await ticketUserModel.findOne({
                    'ticketlog.ticketId': interaction.channel.id
                }).catch(err => client.logger.error(err));

                if (!ticketData) {
                    return await interaction.editReply({ content: 'Ticket system is not active!', ephemeral: true });
                } else {
                    var closeTicket = ticketData.closedParent;
                }

                const userButton = interaction.user.id;

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm-close-ticket')
                            .setLabel('Close ticket')
                            .setStyle(ButtonStyle.Danger),

                        new ButtonBuilder()
                            .setCustomId('no-close-ticket')
                            .setLabel('Cancel closure')
                            .setStyle(ButtonStyle.Secondary),
                    );

                const verif = await interaction.editReply({
                    content: 'Are you sure you want to close the ticket?',
                    components: [row]
                });

                const collector = verif.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 15000
                });

                collector.on('collect', async (i: any) => {
                    await i.deferUpdate();
                    if (i.customId == 'confirm-close-ticket') {
                        try {
                            await closeTicketEditInt(client, interaction);
                            await i.editReply({
                                content: `Ticket closed by <@!${i.user.id}>`,
                                components: []
                            });
                            await closeTicketEmbed(client, interaction).then(async () => {
                                await closeTicketChan(client, interaction, closeTicket, ticketData.ticketSupportId, ticketUser.userId);
                                collector.stop();
                            });
                        } catch (error: Error | any) {
                            if (error.code == 10062) {
                                const followUpContent = 'An error occurred while closing the ticket. Please try again.';
                                client.logger.error(`Error 86 | ${followUpContent}`);
                                await interaction.followUp({ content: followUpContent });
                            } else {
                                client.logger.error(`An error occurred while editing the reply: ${error}`);
                            }
                        }
                    }

                    if (i.customId == 'no-close-ticket') {
                        await i.editReply({
                            content: `**Ticket closure cancelled!** (<@${i.user.id}>)`,
                            components: []
                        });
                        collector.stop();
                    }
                });

                collector.on('end', async (collected: Collection<Snowflake, Message>) => {
                    if (collected.size <= 0) {
                        await interaction.editReply({
                            content: `**Ticket closure cancelled!** (<@!${userButton}>)`,
                            components: []
                        }).catch(async (err: Error | any) => {
                            if (err.code == 10008) {
                                await interaction.channel.send({ content: '**ERROR: Interaction Not Found!**' }).then((msg: Message) => {
                                    setTimeout(function () {
                                        msg.delete();
                                    }, 4000);
                                });
                            }
                        });
                    }
                });
            }

        } catch (error: Error | any) {
            if (error.code === 10062) {
                client.logger.error('Unknown interaction error occurred:', error);
            } else {
                client.logger.error('An error occurred:', error);
            }
        }
    }
}

export default event;