import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import { SlashCommand } from '../../types';

const command: SlashCommand = {
    cooldown: 10000,
    owner: false,
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription("Ping Pong!")
        .setDMPermission(true),
    async execute(interaction, client) {
        await interaction.reply({ content: "**🏓 Pong!**" });
        const embed = new EmbedBuilder()
            .addFields({ name: "Ping:", value: Math.round(client.ws.ping) + "ms" })
            .setColor("Random")
            .setTimestamp()
        await interaction.editReply({ embeds: [embed] });
    }
}

export default command;