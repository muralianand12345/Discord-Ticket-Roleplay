import { Events } from "discord.js";

import reactionModLog from "../../database/schema/reactionModLog";
import { BotEvent } from "../../../types";

const event: BotEvent = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user, client) {

        if (!client.config.moderation.reactionmod.enabled) return;
        if (user.bot) return;

        const emojisToRemove = client.config.moderation.reactionmod.emojitoremove;
        const emoji = reaction.emoji.name;

        if (reaction.message && emojisToRemove.includes(emoji)) {
            try {

                const reactionModData = await reactionModLog.findOne({
                    userId: user.id
                }).catch((err: Error) => { return; });

                if (!reactionModData) {
                    const newReactionModData = new reactionModLog({
                        userId: user.id,
                        count: 1,
                        logs: [{
                            guildId: reaction.message.guildId,
                            channelId: reaction.message.channelId,
                            emoji: emoji,
                            timestamp: new Date(),
                        }],
                    });
                    await newReactionModData.save().catch((err: Error) => { return; });
                } else {
                    reactionModData.count += 1;
                    reactionModData.logs.push({
                        guildId: reaction.message.guildId,
                        channelId: reaction.message.channelId,
                        emoji: emoji,
                        timestamp: new Date(),
                    });
                    await reactionModData.save().catch((err: Error) => { return; });
                }
                await reaction.remove(user);
            } catch (error) {
                client.logger.error(`Error removing ${emoji} reaction:`, error);
            }
        }
    }
}

export default event;