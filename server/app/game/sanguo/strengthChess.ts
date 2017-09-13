import { Chess, EChessType } from './chess';

export class StrengthChess extends Chess {
    constructor() {
        super();

        this.type = EChessType.strength;
        this.attackDistance = 1;
        this.speed = 3;
        this.counter = 50;
        this.mpRecover = 20;
    }
}