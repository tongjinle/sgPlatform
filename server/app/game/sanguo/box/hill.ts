// 山峰
import { Box } from '../box';

export class HillBox extends Box {

    constructor() {
        super();

        this.canMove = false;
        this.canBuild = false;
        this.isVisiable = false;
        this.isZOC = true;
    }


}