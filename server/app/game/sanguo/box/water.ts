// 水域
import { Box } from '../box';

class WaterBox extends Box {

    constructor() {
        super();

        this.canMove = false;
        this.canBuild = false;
        this.isVisiable = true;
        this.isZOC = false;
    }


}