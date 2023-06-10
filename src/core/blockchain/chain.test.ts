import {Chain} from "./chain";
import * as console from "console";

describe('Chain', () => {
    const node = new Chain();

    it('getLength()', () => {
        console.log(node.getLength());
    })

    it('getLatestBlock()', () => {
        console.log(node.getLatestBlock());
    })

    it('miningBlock()', () => {
        for (let i=1 ; i <= 5; i++) {
            node.miningBlock("1c4c604859ae9035247addc7cbf900fec9aa5f40");
        }
        console.log(node.getLatestBlock().data);
        console.log(node.getUnspentTxOuts());

    })
})