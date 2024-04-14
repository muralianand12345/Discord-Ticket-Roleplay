import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, TextChannel, Message } from 'discord.js';

import ticketGuildModal from '../../events/database/schema/ticketGuild';
import { SlashCommand } from '../../types';

const checkChan = (chan: any, type: ChannelType) => {
    if (chan.type !== type) return false;
    return true;
}

const command: SlashCommand = {
    cooldown: 10000,
    owner: false,
    userPerms: ['Administrator'],
    botPerms: ['Administrator'],
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription("Setup or stop the tickets system in your server!")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the tickets system for your server!')
                .addChannelOption(option =>
                    option.setName('ticket-channel')
                        .setDescription('The channel where the tickets will be created!')
                        .setRequired(true),
                )
                .addChannelOption(option =>
                    option.setName('ticket-log-channel')
                        .setDescription('The channel where the tickets will be logged!')
                        .setRequired(true),
                )
                .addChannelOption(option =>
                    option.setName('ticket-closed-category')
                        .setDescription('The category where the closed tickets will be moved!')
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option.setName('ticket-support-role')
                        .setDescription('The role which will be able to see the tickets!')
                        .setRequired(true),
                )

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stop the tickets system for your server!'),
        ),
    async execute(interaction, client) {

        var ticketGuildData;

        if (interaction.options.getSubcommand() === "setup") {

            await interaction.deferReply({ ephemeral: true });

            const ticketChannel = interaction.options.getChannel('ticket-channel') as TextChannel;
            const ticketLogChannel = interaction.options.getChannel('ticket-log-channel');
            const ticketSupportRole = interaction.options.getRole('ticket-support-role');
            const ticketClosedCategory = interaction.options.getChannel('ticket-closed-category');

            if (!checkChan(ticketChannel, ChannelType.GuildText) || !checkChan(ticketLogChannel, ChannelType.GuildText) || !checkChan(ticketClosedCategory, ChannelType.GuildCategory)) {
                return await interaction.editReply({ content: 'Invalid Ticket Channel!' });
            }

            ticketGuildData = await ticketGuildModal.findOne({ guildId: interaction.guild?.id });

            if (!ticketGuildData) {
                ticketGuildData = new ticketGuildModal({
                    guildId: interaction.guild?.id,
                    category: [],
                    closedParent: "",
                    ticketMaxCount: 2,
                    ticketCount: 0,
                    ticketSupportId: "",
                    ticketLogId: "",
                    ticketStatus: false,
                });
            }

            let ticketConfig: string | undefined;

            const collectorFilter = (message: Message) => message.author.id === interaction.user.id;
            await interaction.editReply({ content: `Enter your Ticket Category | Labal Name, Channel CategoryID, Emoji.\nExample\n\`\`\`Support, 123456789, ❤️\nPurchase, 987654321, ✅\`\`\`` }).then(async () => {
                await interaction.channel?.awaitMessages({ filter: collectorFilter, max: 1, time: 300000, errors: ['time'] })
                    .then(async (collected: any) => {
                        await interaction.editReply({ content: 'Processing...' });
                        ticketConfig = collected.first().content || "";
                    })
                    .catch(async (collected) => {
                        if (collected.size === 0) {
                            await interaction.editReply({ content: 'Successfully added!' });
                        }
                    })
            });

            var ticketConfigArray = ticketConfig?.split('\n');
            var ticketCategoryArray: any = [];

            ticketConfigArray?.forEach(async (eachCategory: string) => {
                var eachCategoryArray = eachCategory.split(',');

                if (eachCategoryArray.length !== 3) {
                    return await interaction.editReply({ content: 'Invalid Category!' });
                }

                var eachCategoryObject = {
                    label: eachCategoryArray[0],
                    value: eachCategoryArray[1].replace(/\s/g, ''),
                    emoji: eachCategoryArray[2].replace(/\s/g, '')
                };
                ticketCategoryArray.push(eachCategoryObject);
            });

            ticketGuildData.closedParent = ticketClosedCategory?.id || "";
            ticketGuildData.category = ticketCategoryArray || [];
            ticketGuildData.ticketSupportId = ticketSupportRole?.id || "";
            ticketGuildData.ticketLogId = ticketLogChannel?.id || "";
            ticketGuildData.ticketStatus = true;
            await ticketGuildData.save();

            const embedReply = new EmbedBuilder()
                .setTitle('Ticket System')
                .setDescription(`Ticket System has been setup!`)
                .setColor('Green');

            await interaction.editReply({ embeds: [embedReply] });

            const embed = new EmbedBuilder()
                .setColor('#6d6ee8')
                .setTitle("Open a Support Ticket")
                .setDescription('Click on the button to Raise Ticket')
                .setFooter({ text: `${client.user?.tag}` || "", iconURL: client.user?.avatarURL() || "" })
            const button = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('open-ticket')
                        .setLabel('TICKET')
                        .setEmoji('🎫')
                        .setStyle(ButtonStyle.Success),
                );

            await ticketChannel?.send({ embeds: [embed], components: [button] })

        }

        if (interaction.options.getSubcommand() === "stop") {

            await interaction.deferReply({ ephemeral: true });

            ticketGuildData = await ticketGuildModal.findOne({ guildId: interaction.guild?.id });

            if (!ticketGuildData) {
                return await interaction.editReply({ content: 'Ticket system is not active!' });
            }

            ticketGuildData.ticketStatus = false;
            await ticketGuildData.save();

            const embedReply = new EmbedBuilder()
                .setTitle('Ticket System')
                .setDescription(`Ticket System has been stopped!`)
                .setColor('Red');

            await interaction.editReply({ embeds: [embedReply] });
        }
    }
}

export default command;