import express from "express";
import nunjucks from "nunjucks";
import {Wallet} from "./wallet";
import axios from "axios";

const app = express();
const userid = process.env.USERID || "web7722";
const userpw = process.env.USERPW || "1234";
const baseURL = process.env.BASEURL || "http://localhost:3000";
const baseAuth = Buffer.from(userid + ":" + userpw).toString("base64");

// 블록체인 서버에 보낼 요청틀
const request = axios.create({
//baseURL , header, authorization 내용 세팅
    baseURL,
    headers: {
        Authorization:
            "Basic " + baseAuth,
        "Content-type": "application/json",
    },
});

app.use(express.json());
app.set("view engine", "html");

nunjucks.configure("views", {
    express: app, watch: true,
});

app.get("/", (req, res) => {
    res.render("index");
})

app.post("/newWallet",(req, res) => {
    res.json(new Wallet());
})

app.post("/walletList",(req, res) => {
    res.json(Wallet.getWalletList());
})

app.get("/wallet/:account",async (req, res) => {
    const { account } = req.params;
    console.log("wallet", account);
    const privateKey = Wallet.getWalletPrivateKey(account);
    const wallet = new Wallet(privateKey);
    const response = await request.post('/getBalance', {account});
    wallet.balance = response.data.balance;
    res.json(wallet);
})

app.post('/sendTransaction', async (req, res) => {
    console.log(req.body);
    const {
        sender: {publicKey, account},
        received,
        amount,
    } = req.body;

    const signature = Wallet.createSign(req.body);
    const txObject = {
        sender: publicKey,
        received,
        amount,
        signature,
    };

    const response = await request.post('/sendTransaction',txObject);
    console.log(response.data);
    res.json({});
})

app.listen(3005,() => {
    console.log("server onload #port: 3005");
})