import { Events } from "discord.js";

import ticketGuild from "../../database/schema/ticketGuild";
import { claimTicketEmbed } from "../../../utils/ticket/ticketEmbed";
import { BotEvent } from '../../../types';

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.customId == "claim-ticket") {
            var ticketData = await ticketGuild.findOne({
                guildId: interaction.guild.id
            }).catch(err => client.logger.error(err));
            if (!interaction.member.roles.cache.has(ticketData.ticketSupportId)) return interaction.reply({ content: 'Tickets can only be claimed by \'Ticket Supporters\'', ephemeral: true });
            await claimTicketEmbed(client, interaction);
        }
    }
}

export default event;