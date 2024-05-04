import { Schema, model } from "mongoose";
import { IModmailUser } from "../../../types";

const modmailUserSchema = new Schema<IModmailUser>({
    userId: { type: String, required: true },
    status: { type: Boolean, required: true },
    threadId: { type: String, required: false },
    count: { type: Number, required: true }
});

export default model('modmail-user', modmailUserSchema);