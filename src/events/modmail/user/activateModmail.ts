import { Events } from "discord.js";

import modmailUserModal from "../../database/schema/modmailUser";
import { BotEvent } from "../../../types";
import { embedSend } from "../../../utils/modmail/modmailFunction";

const event: BotEvent = {
    name: Events.MessageCreate,
    async execute(message, client) {

        if (!client.config.modmail.enabled) return;
        if (message.guild) return;
        if (message.author.bot) return;

        const modMailData = await modmailUserModal.findOne({
            userId: message.author.id
        });

        if (!modMailData) {
            var modmail = new modmailUserModal({
                userId: message.author.id,
                status: false,
                threadId: null,
                count: 0
            });
            await modmail.save();
            return embedSend(client, message);
        }

        if (modMailData.status == false) return embedSend(client, message);
    }
}

export default event;