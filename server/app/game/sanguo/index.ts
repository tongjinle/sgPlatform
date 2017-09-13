import * as _ from 'underscore';
import loger from '../../loger';
import { LimitGame } from '../../LimitGame';
import * as Protocol from '../../../struct/protocol';

import { ChessBoard } from './chessBoard';

// 1v1
export class Sanguo extends LimitGame {

    chessBoard:ChessBoard;

    constructor() {
        super();


        this.initParseActionHandlerList();
    }


    private initParseActionHandlerList(): void {
        let list = this.parseActionHandlerList;

        // todo
        // 选择棋子
        // 反选棋子
        // 移动棋子
        // 攻击
        // 待机
        // 选择技能
        // 反选技能
        // 选择技能目标(可以是棋子或者格子)

    }
}

Sanguo.PlayerCount = 2;

