
import {Block} from "@core/blockchain/block";
import {DIFFICULTY_ADJUSTMENT_INTERVAL, GENESIS} from "@core/config";
export class Chain {
    blockChain:Block[];
    constructor() {
        this.blockChain = [Block.getGENESIS()];
    }

    public getChain(){
        return this.blockChain;
    }

    public getLength(): number {
        return this.blockChain.length;
    }
    public getLatestBlock(): Block {
        const length = this.getLength();
        return this.blockChain[length - 1];
    }

    addBlock(data: string[]): Failable<Block,string> {
        // 가장 최근에 만들어진 블록
        const previousBlock: Block = this.getLatestBlock();

        // 10번쨰 전 블록 혹은 GENESIS 블록
        // 이렇게 가져오는 이유는 블록을 생성할 때마다 난이도 체크 위함
        const adjustmentBlock: Block = this.getAdjustmentBlock();
        const newBlock: Block = Block.generateBlock(
            previousBlock,
            data,
            adjustmentBlock,
        );

        const isValid: Failable<Block, string> = Block.isValidNewBlock(
            newBlock,
            previousBlock,
        );

        if (isValid.isError) {
            return { isError: true, error: isValid.error };
        }

        this.blockChain.push(newBlock);
        return { isError: false, value: newBlock };
    }

    // 난이도 체크를 위함
    // 10개 블록 높이가 -10인 블록 구하기
    getAdjustmentBlock(): Block {
        const curLength = this.getLength();
        if (curLength < DIFFICULTY_ADJUSTMENT_INTERVAL) {
            return GENESIS;
        }
        return this.blockChain[curLength - DIFFICULTY_ADJUSTMENT_INTERVAL];
    }
}