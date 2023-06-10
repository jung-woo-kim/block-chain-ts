import {Block} from "./block";
import {DIFFICULTY_ADJUSTMENT_INTERVAL, GENESIS} from "../config";
import {TxIn} from "../transaction/txin";
import {TxOut} from "../transaction/txout";
import {Transaction} from "../transaction/transaction";
import {UnspentTxOut} from "../transaction/unspentTxOut";

export class Chain {
    blockChain:Block[];
    private unspentTxOuts: IUnspentTxOut[];
    private transactionPool: ITransaction[];
    constructor() {
        this.blockChain = [Block.getGENESIS()];
        this.unspentTxOuts = [];
        this.transactionPool = [];
    }

    // 트랜잭션 풀을 반환
    public getTransactionPool(): ITransaction[] {
        return this.transactionPool;
    }

    // 트랜잭션 풀에 트랜잭션 추가 함수
    public appendTransactionPool(transaction: ITransaction) {
        this.transactionPool.push(transaction);
    }

    // 트랜잭션 풀 업데이트
    public updateTransactionPool(newBlock: IBlock) {
        let txPool: ITransaction[] = this.getTransactionPool();
        newBlock.data.forEach((tx: ITransaction) => {
            txPool = txPool.filter((txp) => txp.hash !== tx.hash);
        });

        this.transactionPool = txPool;
    }

    // UTXO get 함수(UTXO 조회 함수)
    public getUnspentTxOuts(): IUnspentTxOut[] {
        return this.unspentTxOuts;

    }

    // UTXO 추가함수
    public appendUTXO(utxo: IUnspentTxOut[]) {
        // unspentTxOuts 배열에 utxo 값을 복사해서 배열에 추가
        this.unspentTxOuts.push(...utxo);
    }

    // 마이닝 블록
    public miningBlock(account: string): Failable<Block, string> {
        // 코인베이스 트랜잭션의 내용을 임의로 만든것
        const txIn: ITxIn = new TxIn("", this.getLatestBlock().height + 1);
        // 코인의 가격은 50이라고 가정
        const txOut: ITxOut = new TxOut(account, 50);
        const coinbaseTransaction: Transaction = new Transaction([txIn], [txOut]);
        // createUTXO 함수로 UTXO에 담을 객체를 만들어 준것
        // const utxo = coinbaseTransaction.createUTXO();
        // // UTXO에 appendUTXO함수로 만든 객체를 추가
        // this.appendUTXO(utxo);

        return this.addBlock([coinbaseTransaction, ...this.getTransactionPool()]);
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

    public addBlock(data: ITransaction[]): Failable<Block, string> {
        // 마지막 블럭 가져오기
        const previousBlock = this.getLatestBlock();
        // 10번째 전 블록 가져오기
        const adjustmentBlock: Block = this.getAdjustmentBlock();
        // 마이닝이 끝난 추가할 블록 가져오기
        const newBlock = Block.generateBlock(previousBlock, data, adjustmentBlock);
        // 새로운 블록을 이전 블록과 검증을 하는데 isValidNewBlock 이전블록(마지막 블록)과 새로운 블록을
        // 매개변수로 전달해서 블록의 높이, 해시 검사
        const isValid = Block.isValidNewBlock(newBlock, previousBlock);

        // 블록검증 에러시 에러 반환
        if (isValid.isError) return { isError: true, error: isValid.error };

        // 다 통과 후 블록체인에 추가
        this.blockChain.push(newBlock);

        newBlock.data.forEach((_tx: ITransaction) => {
            this.updateUTXO(_tx);
        })

        this.updateTransactionPool(newBlock)

        // 에러가 없다고 알려주고 value로 Block타입의 newBlock반환
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
        _receivedBlock.data.forEach((_tx: ITransaction)=>{
            this.updateUTXO(_tx);
        });
        this.updateTransactionPool(_receivedBlock);
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

        this.blockChain.forEach((_block:IBlock) => {
            this.updateTransactionPool(_block);
            _block.data.forEach((_tx:ITransaction) => {
                this.updateUTXO(_tx);
            })
        })

        return {isError: false, value: undefined};
    }

    updateUTXO(tx: ITransaction) {
        // txOutId, txOutIndex, account, amount
        // UTXO 배열을 가져오고 getUnspnetTxOuts 함수를 사용해서
        const unspentTxOuts: UnspentTxOut[] = this.getUnspentTxOuts();
        // UTXO에 추가할 unspentTxOuts 객체를 생성
        // 트랜잭션 객체의 배열안에 있는 txOut객체를 사용해서 새로 생성될
        // UnspentTxOut 객체를 만들어준다.
        const newUnspentTxOuts = tx.txOuts.map((txout, index) => {
            return new UnspentTxOut(tx.hash, index, txout.account, txout.amount);
        });
        // filter로 unspentTxOuts 배열 안에서 txOut객체들은 제거하고 생성된 newUnspentTxOuts배열을 붙여준다.
        const tmp = unspentTxOuts
            .filter((v: UnspentTxOut) => {
                const bool = tx.txIns.find((value: TxIn) => {
                    return (
                        value.txOutId === v.txOutId && v.txOutIndex === value.txOutIndex
                    );
                });
                // !undefined == true
                // !{} == false
                return !bool;
            })
            .concat(newUnspentTxOuts);
        // UTXO에 사용한  unspentTxOut 객체 제거와 생성된 unspnetTxOuts 객체를 UTXO를 추가
        // tmp배열을 reduce함수로 acc 배열 안에서 해당 조건에 맞는 값을 내보내주고
        // acc 배열에 push해서 배열에 넣어주고 acc배열을 반환해서
        // unspentTmp에 담고 this.unspentTxOuts에 바인딩
        let unspentTmp: UnspentTxOut[] = [];
        this.unspentTxOuts = tmp.reduce((acc, uxto) => {
            const find = acc.find(({txOutId, txOutIndex}) => {
                return txOutId === uxto.txOutId && txOutIndex === uxto.txOutIndex;
            });
            if (!find) acc.push(uxto);
            return acc;
        }, unspentTmp);
    }
}