import {SHA256} from "crypto-js";
import merkle from "merkle";
import {
    BLOCK_GENERATION_INTERVAL,
    BLOCK_GENERATION_TIME_UNIT,
    DIFFICULTY_ADJUSTMENT_INTERVAL,
    GENESIS
} from "../config";
import hexToBinary from "hex-to-binary";
import {BlockHeader} from "./blockHeader";
export class Block extends BlockHeader implements IBlock {
    data: string[];
    difficulty: number;
    hash: string;
    merkleRoot: string;
    nonce: number;


    constructor(_previousBlock: IBlock, _data: string[], _adjustmentBlock: Block) {
        super(_previousBlock);
        this.merkleRoot = Block.getMerkleRoot(_data);
        this.hash = Block.createBlockHash(this);

        this.data = _data;
        this.difficulty = Block.getDifficulty(
            this,
            _adjustmentBlock,
            _previousBlock
        );
        this.nonce = 0;

    }

    public static getGENESIS(): Block {
        return GENESIS;
    }

    private static getMerkleRoot<T>(_data:T[]) {
        const merkleTree = merkle("sha256").sync(_data);
        return merkleTree.root();
    }

    private static createBlockHash(_block: Block) {
        const {
            version,
            timestamp,
            height,
            merkleRoot,
            previousHash,
            difficulty,
            nonce
        } = _block;
        const values: string = `${version}${timestamp}${height}${merkleRoot}${previousHash}${difficulty}${nonce}`;
        return SHA256(values).toString();
    }

    // 블럭 검증 코드
    static isValidNewBlock(
        _newBlock: Block,
        _previousBlock: Block,
    ): Failable<Block, string> {
        /*
        1. 이전 블록 높이 +1 === 새로생긴 블록 높이 check
        2. 이전블록.해시 === 새로생긴블록.이전해시 check
        3. 새로생긴 블록의 해시를 새로 만듬 === 새로생긴블록.해시 check
         */

        if (_previousBlock.height + 1 !== _newBlock.height) {
            return { isError: true, error: '블록 높이가 맞지 않습니다.' };
        }

        if (_previousBlock.hash !== _newBlock.previousHash) {
            return { isError: true, error: '이전 해시값이 맞지않습니다.' };
        }

        if (Block.createBlockHash(_newBlock) !== _newBlock.hash) {
            return { isError: true, error: '블록해시가 올바르지 않습니다.' };
        }

        return { isError: false, value: _newBlock };
    }

    static generateBlock(
        _previousBlock: Block,
        _data: string[],
        _adjustmentBlock: Block,
    ) {
        const generated = new Block(_previousBlock, _data, _adjustmentBlock);
        // 난이도에 따른 nonce값을 구하는 함수(findBlock) 호출
        return Block.findBlock(generated);
    }

    // 이 값을 구하는 과정이 Mining
    // 작업 증명 방식의 합의 알고리즘
    static findBlock(_generated: Block) {
        let nonce: number = 0;
        let hash: string;
        while (true) {
            nonce++;
            _generated.nonce = nonce;
            hash = Block.createBlockHash(_generated);
            const binary: string = hexToBinary(hash);
            const result = binary.startsWith('0'.repeat(_generated.difficulty));

            if (result) {
                _generated.hash = hash;
                return _generated;
            }
        }
    }

    static getDifficulty(
        _newBlock: Block,
        _adjustmentBlock: Block,
        _previousBlock: Block
    ): number {

        if (_newBlock.height <= 9){
            return 0;
        }
        if (_newBlock.height <= 19){
            return 1;
        }

        // 10번째 배수의 블록에 한해서만 난이도 구현
        // 10개의 묶음이 같은 난이도
        if (_newBlock.height % DIFFICULTY_ADJUSTMENT_INTERVAL != 0) {
            return _previousBlock.difficulty;
        }

        const takenTime: number = _newBlock.timestamp - _adjustmentBlock.timestamp;

        // 6000
        const expectedTime: number =
            BLOCK_GENERATION_INTERVAL * BLOCK_GENERATION_TIME_UNIT * DIFFICULTY_ADJUSTMENT_INTERVAL;

        // 실제 생성 시간이 기대시간의 절반 이하일 때, 난이도 UP
        if (takenTime < expectedTime / 2) {
            return _adjustmentBlock.difficulty + 1;
        }

        // 실제 생성시간이 기대시간의 2배 이상일 때, 난이도 down
        if (takenTime > expectedTime * 2) {
            return _adjustmentBlock.difficulty - 1;
        }

        return _adjustmentBlock.difficulty;
    }
}