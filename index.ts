

import express, { Request, Response } from 'express';
import {P2PServer} from "./src/server/p2p";

const app = express();
const ws = new P2PServer();

app.use(express.json());

app.post('/addToPeer', (req: Request, res: Response) => {
    const { peer } = req.body;
    ws.connectToPeer(peer);
});

app.listen(3000, () => {
    console.log('서버 시작 \n PORT : #3000');
    ws.listen();
});