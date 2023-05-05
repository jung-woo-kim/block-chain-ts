import {Chain} from "@core/blockchain/chain";
import * as console from "console";

describe('Chain', () => {
    const node = new Chain();

    it('getLength()', () => {
        console.log(node.getLength());
    })

    it('getLatestBlock()', () => {
        console.log(node.getLatestBlock());
    })

    it('addBlock()', () => {
        for (let i=1 ; i <= 30; i++) {
            node.addBlock([`Block #${i}`]);
        }
        console.log(node.getChain());
    })
})