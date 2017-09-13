import {Chess} from './chess';

export enum ESkillTarget {
    // 单个敌方棋子
    singleEnemy,
    // 单个棋盘位置
    singlePosition,
    // 单个友军棋子
    singleFriend,
    // 自施法
    self



};

export enum ESkillType {
    // 主动技能
    active,
    // 被动技能
    deactive
};

export class Skill {
    owner:Chess;
    name: string;
    

    type:ESkillType;


    // 获取技能可以选择的目标
    // 使用技能

};