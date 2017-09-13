import { Chess } from './chess';

export enum EBagType {
    damage,
    heal
};

export namespace bagDataStruct {

    export interface IBasicBagData{
        source: Chess;
        target: Chess;

    };

    export interface IDamageBagData extends IBasicBagData {
        // 伤害值
        amount: number;
    };
}


export class Bag{
    type: EBagType;
    data: bagDataStruct.IBasicBagData;

    constructor(type: EBagType, data: bagDataStruct.IBasicBagData) {
        this.type = type;
        this.data = data;
    }

    done():void{
        let type = this.type;
        let data = this.data;

        if(type == EBagType.damage){
            let damageAmount = (data as bagDataStruct.IDamageBagData).amount;
           data.target.acceptDamage(damageAmount);
        }
    }

};







