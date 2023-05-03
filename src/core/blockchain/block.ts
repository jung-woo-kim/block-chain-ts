import {SHA256} from "crypto-js";
import {BlockHeader} from "@core/blockchain/blockHeader";
import merkle from "merkle";
import {GENESIS} from "@core/config";

export class Block extends BlockHeader implements IBlock {
    data: string[];
    difficulty: number;
    hash: string;
    merkleRoot: string;
    nonce: number;


    constructor(_previousBlock: IBlock, _data: string[]) {
        super(_previousBlock);
        this.merkleRoot = Block.getMerkleRoot(_data);
        this.hash = Block.createBlockHash(this);

        this.data = _data;
        this.difficulty = 0;
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
        const { version, timestamp, height, merkleRoot, previousHash } = _block;
        const values: string = `${version}${timestamp}${height}${merkleRoot}${previousHash}`;
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
}