import { Events } from "discord.js";

import modmailUserModal from "../../database/schema/modmailUser";
import { BotEvent } from "../../../types";

const event: BotEvent = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (!client.config.modmail.enabled) return;
        if (!message.guild) return;
        if (message.author.bot) return;
        if (message.author.id === client.user.id) return;

        const modTMailData = await modmailUserModal.findOne({
            threadId: message.channel.id
        });

        if (modTMailData) {
            if (modTMailData.status) {
                const userID = modTMailData.userId;
                const user = await client.users.fetch(userID);

                if (user) {
                    await user.send({ content: `**${client.config.modmail.staffname}**: ${message.content}` }).then(() => {
                        message.react('✅');
                    }).catch((err: Error | any) => {
                        message.react('❌');
                        client.logger.error(err);
                    });
                }

                if (message.attachments) {
                    await message.attachments.forEach(async (value: any, key: any) => {
                        var media = value['url'];
                        await user.send({ content: `${media}` }).then(() => {
                            message.react('✅');
                        }).catch((err: Error | any) => {
                            message.react('❌');
                            client.logger.error(err);
                        });
                    });
                }
            }
        }
    }
}

export default event;