import { Chess } from './chess';
import { Skill } from './skill';
import { Position } from './position';



export namespace sanguoEvent {
    export let enterChessBoard: string = 'enterChessBoard';
    export let leaveChessBoard: string = 'leaveChessBoard';
    export let resetPosition: string = 'resetPosition';
    export let addSkill: string = 'addSkill';
    export let move: string = 'move';
    export let attack: string = 'attack';
    export let selectSkill: string = 'selectSkill';
    export let unselectSkill: string = 'unselectSkill';
    export let castSkill: string = 'castSkill';
    export let rest: string = 'rest';

};


export namespace sanguoDataStruct {
    export interface IEnterChessBoard {
        chess: Chess;
    }

    export interface ILeaveChessBoard {
        chess: Chess;
    }

    export interface IResetPosition {
        chess: Chess;
        lastPosition: Position;
        position: Position;
    }

    export interface IAddSkill {
        chess: Chess;
        skill: Skill
    };

    export interface IRest {
        chess: Chess;
    };

    export interface ISelectSkill {
        chess: Chess;
        skill: Skill
    };

    export interface IUnselectSkill {
        chess: Chess;
        skill: Skill
    };

};