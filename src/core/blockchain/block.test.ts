import {Block} from "@core/blockchain/block";
import * as console from "console";
import {GENESIS} from "@core/config";

describe("Block 검증",() =>{
    let newBlock: Block;

    it('블록 생성 ', function () {
        const data = ["Block #2"];
        newBlock = Block.getGENESIS();
    });

    it('블록 검증 테스트', () => {
        const isValidBlock = Block.isValidNewBlock(newBlock,GENESIS);

        if (isValidBlock.isError) {
            console.error(isValidBlock.error);
            return expect(true).toBe(false);
        }

        expect(isValidBlock.isError).toBe(false);
    })
})