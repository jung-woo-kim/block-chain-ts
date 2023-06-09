import {randomBytes} from "crypto";
import elliptic from "elliptic";
import fs from "fs";
import path from "path";
import {SHA256} from "crypto-js";

const dir = path.join(__dirname,"../data");

const ec = new elliptic.ec("secp256k1");

export class Wallet {
    public account: string;
    public privateKey: string;
    public publicKey: string;
    public balance: number;

    constructor(_privateKey: string = "") {
        this.privateKey = _privateKey || this.getPrivateKey();
        this.publicKey = this.getPublicKey();
        this.account = this.getAccount();
        this.balance = 0;
        // 지갑을 파일로 생성하여 저장
        Wallet.createWallet(this);
    }

    static createWallet(myWallet: Wallet) {
        const fileName = path.join(dir, myWallet.account);
        const fileContent = myWallet.privateKey;
        fs.writeFileSync(fileName, fileContent);
    }

    private getAccount() {
        return Buffer.from(this.publicKey).slice(26).toString();
    }

    private getPublicKey() {
        const keyPair = ec.keyFromPrivate(this.privateKey);
        return keyPair.getPublic().encode("hex",true);
    }

    private getPrivateKey() {
        return randomBytes(32).toString("hex");
    }

    static getWalletList() {
        return fs.readdirSync(dir);
    }

    static getWalletPrivateKey(_account: string): string {
        const filepath = path.join(dir, _account);
        const fileContent = fs.readFileSync(filepath);
        return fileContent.toString();
    }


    static createSign(_obj: any) {
        const {
            sender: {publicKey, account},
            received,
            amount,
        } = _obj;

        const hash = SHA256([publicKey, received, amount].join('')).toString();
        const privateKey = Wallet.getWalletPrivateKey(account);
        const keyPair = ec.keyFromPrivate(privateKey);
        return keyPair.sign(hash,'hex');
    }
}