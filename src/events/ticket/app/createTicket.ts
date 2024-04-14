import { Message, Snowflake, Collection, ComponentType, Events, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";

import ticketGuildModel from "../../database/schema/ticketGuild";
import ticketUserModel from "../../database/schema/ticketUser";
import { createTicketChan, checkTicketCategory } from "../../../utils/ticket/ticketFunction";
import { createTicketEmbed, showTicketModal, ticketModalEmbed } from "../../../utils/ticket/ticketEmbed";
import { BotEvent, ITicketCategory, ITicketLog } from '../../../types';

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isButton() && !interaction.isModalSubmit()) return;

        if (interaction.customId === "open-ticket") {
            if (!client.config.ticket.enabled) return interaction.reply({ content: `${interaction.guild.name}'s Ticket system is currently disabled!`, ephemeral: true });
            await interaction.deferReply({ ephemeral: true });

            var ticketGuild = await ticketGuildModel.findOne({
                guildId: interaction.guild.id
            }).catch(err => client.logger.error(err));

            var ticketUser = await ticketUserModel.findOne({
                userId: interaction.user.id
            }).catch(err => client.logger.error(err));

            if (!ticketGuild || !ticketGuild.ticketStatus) {
                return await interaction.editReply({ content: 'Ticket system is not active!', ephemeral: true });
            }

            if (ticketUser) {
                const activeTickets = ticketUser.ticketlog.filter((ticket: ITicketLog) => ticket.activeStatus);
                if (activeTickets.length >= ticketGuild.ticketMaxCount) {
                    return await interaction.editReply({ content: `You are limited to opening \`${ticketGuild.ticketMaxCount}\` tickets. Please close any existing tickets before creating a new one.`, ephemeral: true });
                }
            } else {
                ticketUser = new ticketUserModel({
                    userId: interaction.user.id,
                    ticketlog: [],
                });
                await ticketUser.save();
            }

            const ticketOption = ticketGuild.category.map((category: ITicketCategory) => ({
                label: category.label,
                value: category.value,
                emoji: category.emoji,
            }));

            const chooseEmbed = new EmbedBuilder()
                .setColor('#206694')
                .setAuthor({ name: 'Ticket', iconURL: client.user.avatarURL() })
                .setDescription('Select the category of your ticket')
                .setFooter({ text: client.user.username, iconURL: client.user.avatarURL() })
                .setTimestamp();

            const chooseRow = new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('category-ticket')
                        .setPlaceholder('Select the ticket category')
                        .addOptions(ticketOption),
                );

            const msg = await interaction.editReply({
                embeds: [chooseEmbed],
                components: [chooseRow]
            });

            const collector = await msg.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 30000
            });

            collector.on('collect', async (i: any) => {
                if (i.user.id === interaction.user.id) {

                    if (i.values[0]) {
                        if (await checkTicketCategory(client, interaction, i.values[0])) {
                            return await i.reply({
                                content: 'Sorry, the ticket category is full! Try again later.',
                                ephemeral: true,
                            });
                        }

                        await showTicketModal(client, i);

                        ticketGuild.ticketCount += 1;
                        await ticketGuild.save();

                        await createTicketChan(client, interaction, i.values[0], ticketGuild.ticketCount, ticketGuild.ticketSupportId)
                            .then(async (c) => {
                                await interaction.editReply({
                                    content: `Ticket Created <#${c.id}>`,
                                    embeds: [],
                                    components: []
                                });
                                const opened = await createTicketEmbed(client, interaction, c);
                                let ticketData = {
                                    guildId: interaction.guild.id,
                                    activeStatus: true,
                                    ticketNumber: ticketGuild.ticketCount,
                                    ticketId: c.id,
                                    ticketPannelId: opened.id,
                                };
                                ticketUser.ticketlog.push(ticketData);
                                ticketUser.recentTicketId = c.id;
                                await ticketUser.save();
                            });

                    }
                }
            });

            collector.on('end', async (collected: Collection<Snowflake, Message>) => {
                if (collected.size < 1) {
                    await interaction.editReply({
                        content: 'Ticket creation has timed out!',
                        embeds: [],
                        components: [],
                        ephemeral: true
                    });
                }
            });
        }

        if (interaction.customId == "modal-ticket") {

            ticketUser = await ticketUserModel.findOne({
                userId: interaction.user.id
            }).catch(err => client.logger.error(err));

            const ticketChan = client.channels.cache.get(ticketUser.recentTicketId);
            await interaction.deferReply({ ephemeral: true });

            ticketModalEmbed(client, interaction, ticketChan);
            await interaction.editReply({ content: "Detail Submitted!", ephemeral: true });
        }
    }
}

export default event;