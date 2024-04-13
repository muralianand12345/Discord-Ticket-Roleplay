import { Events, ThreadChannel } from "discord.js";

import modmailUserModal from "../../database/schema/modmailUser";
import { BotEvent } from "../../../types";

const event: BotEvent = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {

        if (interaction.customId == "modmail-close") {

            const modMailData = await modmailUserModal.findOne({
                threadId: interaction.channel.id
            });

            if (modMailData) {
                if (modMailData.status == true) {

                    const channelId = client.config.modmail.channelid;
                    const channel = client.channels.cache.get(channelId);
                    if (!channel) return client.logger.warn(`Channel not found with ID ${channelId}`);
                    const thread = channel.threads.cache.find((x: ThreadChannel) => x.id === modMailData.threadId);

                    modMailData.status = false;
                    modMailData.threadId = null;
                    await modMailData.save();

                    await thread.setLocked(true).catch((err: Error | any) => { return; });

                    await interaction.message.edit({ content: `🔒 ModMail Closed by ${interaction.user.username}`, components: [] });
                    const userID = modMailData.userId;
                    const user = await client.users.fetch(userID);
                    if (user) {
                        await user.send({ content: `**${client.config.modmail.staffname}**: 🔒 The ModMail has been closed!` });
                    }
                }
            }
        }

    }
}

export default event;