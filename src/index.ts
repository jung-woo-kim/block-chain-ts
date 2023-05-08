import express, { Request, Response } from 'express';
import {P2PServer} from "./server/p2p";

const app = express();
const ws = new P2PServer();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("bit-chain");
});

// 블록 내용 조회 API
app.get("/chains", (req, res) => {
    res.json(ws.getChain());
});

// 블록 채굴 API
app.post("/mineBlock", (req, res) => {
    const {data} = req.body;
    const newBlock = ws.addBlock(data);

    if (newBlock.isError) {
        return res.status(500).send(newBlock.error);
    }
    res.json(newBlock.value);
});

// ws 연결 요청 API
app.post("/addToPeer", (req, res) => {
    const {peer} = req.body;
    ws.connectToPeer(peer);
});

// 연결된 sockets 조회
app.get("/peers", (req, res) => {
    const sockets = ws.getSockets().map((s: any) =>
        s._sockets.remoteAddress + ": " + s._sockets.remotePort);
});

app.listen(3000, () => {
    console.log("server onload # port: 3000");
    ws.listen();
});