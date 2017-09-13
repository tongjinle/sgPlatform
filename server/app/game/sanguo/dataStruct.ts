import { Chess } from './chess';
import { Skill } from './skill';




export namespace sanguoEvent {
    export let addSkill: string = 'addSkill';
    export let move: string = 'move';
    export let attack: string = 'attack';
    export let selectSkill: string = 'selectSkill';
    export let unselectSkill: string = 'unselectSkill';
    export let castSkill: string = 'castSkill';
    export let rest: string = 'rest';

};


export namespace sanguoDataStruct {

    export interface IAddSkill {
        chess: Chess,
        skill: Skill
    };

    export interface IRest {
        chess: Chess;
    };

    export interface ISelectSkill{
        chess:Chess,
        skill:Skill
    };

    export interface IUnselectSkill{
        chess:Chess,
        skill:Skill
    };

};