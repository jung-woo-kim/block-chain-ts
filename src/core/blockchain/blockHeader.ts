export class BlockHeader implements IBlockHeader {
    height: number;
    previousHash: string;
    timestamp: number;
    version: string;


    constructor(_previousBlock: IBlock) {
        this.height = _previousBlock.height+1;
        this.previousHash = _previousBlock.hash;
        this.timestamp = BlockHeader.getTimestamp();
        this.version = BlockHeader.getVersion();
    }

    public static getVersion() {
        return '1.0.0';
    }

    private static getTimestamp() {
        return new Date().getTime();
    }
}