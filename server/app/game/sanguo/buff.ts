import { Chess } from './chess';

export enum EBuffType{
    active,
    deactive
};

export class Buff {
    owner: Chess;
    caster: Chess;
    type:EBuffType;


    // 附加到棋子上的时候
    addToChess():void{};


    // 从棋子上消失的时候
    removeFromChess():void{};

};