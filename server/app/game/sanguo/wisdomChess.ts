import { Chess, EChessType } from './chess';

export class WisdomChess extends Chess {
    constructor() {
        super();

        this.type = EChessType.wisdom;

        this.attackDistance = 5;
        this.speed = 2;
        this.counter = 20;
        this.mpRecover = 35;
    }

}
