
import {Block} from "./block";
import {DIFFICULTY_ADJUSTMENT_INTERVAL, GENESIS} from "../config";
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

    public addToChain(_receivedBlock: Block): Failable<undefined, string> {
        const isValid = Block.isValidNewBlock(_receivedBlock, this.getLatestBlock());
        if (isValid.isError) return {isError: true, error: isValid.error};
        this.blockChain.push(_receivedBlock);
        return {isError: false, value: undefined};
    }

    public isValidChain(_chain: Block[]): Failable<undefined, string> {
        if (
            JSON.stringify(_chain[0]) !== JSON.stringify(this.blockChain[0])
        ) {
            return {isError: true, error: "GENESIS 블록이 다름"};
        }
        for (let i = 1; i < _chain.length; i++) {
            const newBlock = _chain[i];
            const previousBlock = _chain[i-1];
            const isValid = Block.isValidNewBlock(newBlock, previousBlock);
            if (isValid.isError) return { isError: true, error: isValid.error};
        }
        return {isError: false, value: undefined};
    }

    public replaceChain(receivedChain: Block[]): Failable<undefined, string> {
        const latestReceivedBlock = receivedChain[receivedChain.length-1];
        const latestBlock = this.getLatestBlock();
        if (latestReceivedBlock.height === 0) {
            return { isError: true, error: '받은 체인의 최신블록이 GENESIS임' };
        }

        if (latestReceivedBlock.height <= latestBlock.height) {
            return { isError: true, error: '자신의 체인이 길거나 같습니다.' };
        }

        if (latestReceivedBlock.previousHash === latestBlock.hash) {
            return { isError: true, error: '블록갯수 하나 차이남' };
        }

        this.blockChain = receivedChain;

        return {isError: false, value: undefined};
    }
}