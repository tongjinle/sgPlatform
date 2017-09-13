import * as _ from 'underscore';
import { Box } from './box';
import { Chess } from './chess';
import { EventEmitter } from 'events';
import { Position } from './position';
export class ChessBoard extends EventEmitter {
    boxList: Box[];
    chessList: Chess[];

    constructor(boxList: Box[], chessList: Chess[]) {
        super();
        this.boxList = boxList;
        this.chessList = chessList;
    }

    getChessByPosition(position: Position): Chess {
        return _.find(this.chessList, ch => ch.position.equal(position));
    }

    // 获取当前的行动棋子
    getCurrChess(): Chess {
        return undefined;
    }


    // 下个回合
    turn() {

    }
}