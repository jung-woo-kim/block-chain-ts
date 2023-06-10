declare interface ITxOut {
    account: string; // 해당 사람의 주소
    amount: number; // 잔액
}

// ITxIn은 IUnsepentTxOut[]을 참조해서 만들고
// ITxIn을 만들때 IUspentTxOut[]에서 삭제
// input
declare interface ITxIn {
    txOutId: string; // ITransaction 객체의 hash값
    txOutIndex: number; // ITransaction에 있는 txOuts 배열의 인덱스
    // signature? : signature 속성이 없어도되고 있어도 된다.
    signature?: string;
}

// 트랜잭션
declare interface ITransaction {
    hash: string; // txIns, txOuts를 사용해서 만든 hash 값
    txOuts: ITxOut[];
    txIns: ITxIn[];
}

// TxOut을 만들때 IUnspentTxOut[]에 생성
// UTXO
declare interface IUnspentTxOut {
    txOutId: string;
    txOutIndex: number;
    account: string;
    amount: number;
}