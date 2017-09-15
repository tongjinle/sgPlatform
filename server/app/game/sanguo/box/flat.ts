// 平地
import { Box } from '../box';

class FlatBox extends Box {

    constructor() {
        super();

        this.canMove = true;
        this.canBuild = true;
        this.isVisiable = true;
        this.isZOC = false;
    }


}