import {Chain} from "@core/blockchain/chain";

export class BlockChain {
    public chain: Chain;

    constructor(chain: Chain) {
        this.chain = chain;
    }
}