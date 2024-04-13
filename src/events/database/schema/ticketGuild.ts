import { Schema, model } from "mongoose";
import { ITicketGuild } from "../../../types";

const ticketGuildSchema = new Schema<ITicketGuild>({
    guildId: { type: String, required: true },
    category: [{
        label: { type: String, required: true },
        value: { type: String, required: true },
        emoji: { type: String, required: true }
    }],
    closedParent: { type: String, required: true },
    ticketMaxCount: { type: Number, required: true },
    ticketCount: { type: Number, required: true },
    ticketSupportId: { type: String, required: true },
    ticketLogId: { type: String, required: true },
    ticketStatus: { type: Boolean, required: true }
});

export default model('ticket-guild', ticketGuildSchema);