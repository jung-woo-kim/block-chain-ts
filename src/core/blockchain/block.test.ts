import {Block} from "@core/blockchain/block";
import * as console from "console";

describe("Block 검증",() =>{
    let newBlock: Block;

    it('블록 생성 ', function () {
        const data = ["Block #2"];
        newBlock = Block.getGENESIS();
        console.log(newBlock);
    });
})