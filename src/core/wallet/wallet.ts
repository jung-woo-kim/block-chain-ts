import elliptic from "elliptic";
import {SHA256} from "crypto-js";
import {UnspentTxOut} from "../transaction/unspentTxOut";
import {Transaction} from "../transaction/transaction";

const ec = new elliptic.ec("secp256k1");

export type Signature = elliptic.ec.Signature

export interface ReceivedTx {
    sender: string;
    received: string;
    amount: number;
    signature: Signature;
}

export class Wallet {
    public account: string;
    public publicKey: string;
    public balance: number;
    public signature: Signature;

    constructor(_sender: string, _signature:Signature, _unspentTxOuts: IUnspentTxOut[]) {
        this.publicKey = _sender;
        this.account = Wallet.getAccount(this.publicKey);
        this.balance = Wallet.getBalance(this.account,_unspentTxOuts);
        this.signature = _signature;
    }

    static sendTransaction(_receivedTx: ReceivedTx, _unspentTxOuts: IUnspentTxOut[]) {
        const verify = Wallet.getVerify(_receivedTx);
        if (verify.isError) throw new Error(verify.error);

        const wallet = new this(_receivedTx.sender, _receivedTx.signature, _unspentTxOuts);

        // TODO : Balance 확인 Transaction 만드는 과정
        if (wallet.balance < _receivedTx.amount) throw new Error("잔약이 모자릅니다.");
        const myUTXO = UnspentTxOut.getMyUnspentTxOuts(wallet.account,_unspentTxOuts);
        return Transaction.createTransaction(_receivedTx, myUTXO);
    }

    static getAccount(_publicKey: string):string {
        return Buffer.from(_publicKey).slice(26).toString();
    }

    private static getVerify(_receivedTx: ReceivedTx): Failable<undefined, string> {
        const {sender, received, amount, signature} = _receivedTx;
        const data: [string, string, number] = [sender, received, amount];
        const hash: string = SHA256(data.join("")).toString();

        const keyPair = ec.keyFromPublic(sender,'hex');
        const isVerify = keyPair.verify(hash, signature);

        if (!isVerify) return { isError: true, error: "서명이 올바르지 않습니다."};
        return {isError: false, value: undefined};
    }

    // 코인 보내는 사람의 잔액을 확인하기 위한 함수
    static getBalance(account: string, unspentTxOuts: IUnspentTxOut[]): number {
        return unspentTxOuts
            .filter((v) => v.account === account)
            .reduce((acc, utxo) => {
                return acc + utxo.amount;
            }, 0);
        // 남아있는 잔액을 확인하고 확인한 잔액으로 보낼수 있는지 확인 하기 위해서
    }
}