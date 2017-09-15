export class Position {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    create(x: number, y: number) {
        let ret: Position;
        ret = new Position();
        ret.x = x;
        ret.y = y;
        return ret;
    };

    equal(position: Position) {
        return this.x == position.x
            && this.y == position.y;
    }
}