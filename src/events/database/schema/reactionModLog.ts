import { Schema, model } from 'mongoose';
import { IReactionMod } from '../../../types';

const reactionModSchema = new Schema<IReactionMod>({
    userId: { type: String, required: true },
    count: { type: Number, default: 0, required: true },
    logs: [{
        guildId: { type: String, required: true },
        channelId: { type: String, required: true },
        emoji: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
    }],
});

export default model('reactionmod-guild', reactionModSchema);