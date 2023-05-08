
import WebSocket from "ws";
import * as console from "console";
import {Chain} from "../core/blockchain/chain";

enum MessageType {
    latest_block = 0,
    all_block = 1,
    receivedChain = 2,
}

interface Message {
    type: MessageType;
    payload: any;
}

export class P2PServer extends Chain {
    private _sockets: WebSocket[];

    constructor() {
        super();
        this._sockets = [];
    }


    getSockets(): WebSocket[] {
        return this._sockets;
    }

    /**
     * 서버 입장에서 클라이언트가 연결을 시도했을 때 실행되는 함수
     */
    listen() {
        const server = new WebSocket.Server({ port:7545});

        server.on("connection", (socket) => {
            this.connectSocket(socket);
        })
    }

    /**
     *
     * @param newPeer
     * url이 파라미터
     */
    connectToPeer(newPeer: string) {
        const socket = new WebSocket(newPeer);
        socket.on("open",() => {
            this.connectSocket(socket);
        })
    }

    private connectSocket(socket: WebSocket) {
        // 향후 브로드캐스팅 하기 위해 배열에 연결된 소켓 저장
        this._sockets.push(socket);
        this.messageHandler(socket);

        const data: Message ={
            type: MessageType.latest_block,
            payload: {},
        }
        this.errorHandler(socket);
        const send = P2PServer.send(socket);
        send(data);
    }

    messageHandler(socket: WebSocket) {

        const messageCallback = (data: string) => {
            const result: Failable<Message, string> = P2PServer.dataParser<Message>(data);
            const send = P2PServer.send(socket);

            if (result.isError) {
                console.log(result.error);
                return;
            }

            if (!result.isError) {
                switch (result.value.type) {
                    case MessageType.latest_block: {
                        const message: Message = {
                            type: MessageType.all_block,
                            payload: [this.getLatestBlock()],
                        };

                        send(message);
                        break;
                    }

                    case MessageType.all_block: {
                        const message: Message = {
                            type: MessageType.receivedChain,
                            payload: this.getChain(),
                        };
                        // ToDo : 받은 latest 블록을 체인에 추가할지 말지 결정
                        const [receivedBlock] = result.value.payload;
                        const isValid = this.addToChain(receivedBlock);
                        if (!isValid.isError) break;

                        send(message);
                        break;
                    }
                    //추가된 부분
                    case MessageType.receivedChain: {
                        const receivedChain: IBlock[] = result.value.payload;
                        // ToDo : 체인을 교체하는 코드 필요
                        // A 노드 상의 블록체인에서 생성된 최신 블록이
                        // B 노드 상의 블록체인에 추가되지 못한 상황이 발생했다는 것은 A 노드의 블록 체인을 교체해야함을 의미
                        this.handleChainResponse(receivedChain);
                        break;
                    }
                }
            }
        };

        socket.on('message', messageCallback);
    }

    static send(_socket: WebSocket) {
        return (_data: Message) => {
            _socket.send(JSON.stringify(_data));
        };
    }

    static dataParser<T>(data: string): Failable<T, string> {
        const result = JSON.parse(Buffer.from(data).toString());

        if (result === undefined) {
            return { isError: true, error: '변환실패' };
        }

        return { isError: false, value: result };
    }

    private handleChainResponse(receivedChain: IBlock[]): Failable<Message | undefined, string> {
        const isValidChain = this.isValidChain(receivedChain);
        if (isValidChain.isError) return {isError: true, error: isValidChain.error};
        const isValid = this.replaceChain(receivedChain);
        if (isValid.isError) return {isError: true, error: isValid.error};
        const message: Message = {
            type: MessageType.receivedChain,
            payload: receivedChain,
        };
        this.broadcast(message);
        return {isError: false, value: undefined};
    }

    broadcast(message: Message): void {
        this._sockets.forEach((socket) => P2PServer.send(socket)(message));
    }

    errorHandler(socket: WebSocket) {
        const  close = () => {
            this._sockets.splice(this._sockets.indexOf(socket),1);
        }
        socket.on("close", close);

        socket.on("error", close);
    }
}