import {randomBytes} from "crypto";
import elliptic from "elliptic";
import { SHA256} from "crypto-js";

const ec = new elliptic.ec("secp256k1");

describe("지갑 테스트", () => {
    let privateKey: string;
    let publicKey: string;
    let signature: elliptic.ec.Signature;

    it('개인키 생성', () => {
        privateKey = randomBytes(32).toString("hex");
        console.log("개인키 : ", privateKey)
    });

    it('공개키 생성 ', () => {
        const keyPair = ec.keyFromPrivate(privateKey);
        publicKey = keyPair.getPublic().encode("hex",true);
        console.log("공개키 : ", publicKey)
    });

    it('서명 만들기 (hash+개인키)', () => {
        const keyPair = ec.keyFromPrivate(privateKey);
        const hash = SHA256("data").toString();

        signature = keyPair.sign(hash, "hex");
        console.log("서명 : ", signature);
    });

    it('서명 검증 하기 (hash+개인키)+공개키 = hash', () => {
        const hash = SHA256("data").toString();
        const verify = ec.verify(hash, signature, ec.keyFromPublic(publicKey, 'hex'));
        console.log(verify);
    });

    it('계정 만들기(지갑 주소) 이더리움 방식', ()=> {
        const buffer = Buffer.from(publicKey);
        // 공개키의 앞자리에 02 혹은 03이 붙어 이를 제거해주기 위함
        const address = buffer.slice(26).toString();
        console.log("계정 : ", address);
    });
})