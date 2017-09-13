import{Buff,EBuffType} from './buff';

export class ActiveBuff extends Buff {
    duration:number;
    maxDuration:number;
    constructor(argument) {
        super();

        this.type = EBuffType.active;
    }

    // 是否触发buff作用的条件成熟
    effectCondition():boolean{
        return false;
    };

    // buff作用
    effect():void{

    };
}