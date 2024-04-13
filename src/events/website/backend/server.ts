import express from 'express';
import { config } from 'dotenv';
import { Events } from 'discord.js';
import path from 'path';

import { BotEvent } from '../../../types';

const app = express();
app.set('trust proxy', 1);
config();

const event: BotEvent = {
    name: Events.ClientReady,
    async execute(client) {

        const Port = process.env.PORT;
        app.use(express.json());

        const ticketLogDir = path.join(__dirname, '../ticket-logs');
        app.use(express.static(ticketLogDir));
        app.listen(Port);
    }
}

export default event;