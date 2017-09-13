import * as _ from 'underscore';
import { Position } from './position';
import { Skill, ESkillType } from './skill';
import { ActiveSkill } from './activeSkill';
import { ChessBoard } from './chessBoard';
import { Buff } from './buff';
import {
    sanguoEvent,
    sanguoDataStruct
} from './dataStruct';
import {
    Bag,
    EBagType,
    bagDataStruct
} from './bag';

// 棋子所有动作
export enum EChessAction {
    none,
    move,
    attack,
    selectSkill,
    unselectSkill,
    castSkill,
    rest
};

// 棋子的状态
export interface IChessStatus {
    isMoved: boolean;
    isAttacked: boolean;
    currSkill: Skill;
};



// 棋子类型
export enum EChessType {
    wisdom,
    strength
};

// 棋子颜色,用于区分阵营
export enum EChessColor {
    red,
    black
};

export class Chess {
    id:string;
    color: EChessColor;
    hp: number;
    maxHp: number;
    skillPoint: number;
    maxSkillPoint: number;
    damage: number;
    speed: number;
    agility: number;
    counter: number;
    skillList: Skill[];
    buffList: Buff[];
    attackDistance: number;
    position: Position;

    chessBoard: ChessBoard;

    protected mpRecover: number;

    private _isCaptain: boolean;
    public get isCaptain(): boolean {
        return this._isCaptain;
    }
    public set isCaptain(v: boolean) {
        this._isCaptain = v;

        let hpRate: number = 1.25;
        let skillPointInc: number = 1;

        this.hp *= hpRate;
        this.maxHp *= hpRate;

        this.skillPoint += skillPointInc;
        this.maxSkillPoint += skillPointInc;
    }


    type: EChessType;


    status: IChessStatus;



    // static actionRoute: { [status: number]: number[] } = {
    //     [EChessAction.none]: [
    //         EChessAction.rest,
    //         EChessAction.attack,
    //         EChessAction.selectSkill,
    //         EChessAction.move
    //     ],
    //     [EChessAction.move]: [
    //         EChessAction.selectSkill,
    //         EChessAction.attack,
    //         EChessAction.rest
    //     ],
    //     [EChessAction.selectSkill]: [
    //         EChessAction.castSkill,
    //         EChessAction.unselectSkill
    //     ],
    //     [EChessAction.unselectSkill]: [
    //         EChessAction.none
    //     ]

    // };

    constructor() {
        this.id = _.uniqueId('chess');
        
        this.skillList = [];
        this.buffList = [];
    }

    // 获取可以行走的格子
    // 由子类来实现
    getMovablePositionList(): Position[] {
        return undefined;
    };

    // 移动
    Move(dest: Position): void {
        return undefined;
    };

    preMove(dest: Position): boolean {
        return !this.status.isMoved
            && this.getMovablePositionList().some(po => po.equal(dest));
    };

    // 获取可以攻击的目标
    getAttackableChessList(): Chess[] {
        return undefined;
    };

    // 普通攻击
    attackChess(chess: Chess): void {
        let bagData: bagDataStruct.IDamageBagData = {
            source: this,
            target: chess,
            amount: this.damage
        };

        let bag = new Bag(EBagType.damage,bagData);

        this.fire(sanguoEvent.attack, bag);

        bag.done();
    };

    preAttackChess(chess: Chess): boolean {
        return !this.status.isAttacked
            && this.getAttackableChessList().some(ch => ch == chess);
    }

    // 获取可以使用的技能
    getCastableSkillList(): Skill[] {
        return undefined;
    };

    // 选择技能
    selectSkill(skillName: string): Skill {
        if (!this.preSelectSkill(skillName)) {
            return;
        }

        let sk = _.find(this.skillList, sk =>
            sk.name == skillName
        );

        if (sk) {
            this.status.currSkill = sk;

            let data: sanguoDataStruct.ISelectSkill = {
                chess: this,
                skill: sk
            };
            this.fire(sanguoEvent.selectSkill, data);
        }
        return undefined;
    };

    protected preSelectSkill(skillName: string): boolean {
        let sk = _.find(this.skillList, sk =>
            sk.name == skillName
            && sk.type == ESkillType.active
            && (sk as ActiveSkill).cd == 0
        );
        return !!sk;
    };

    // 取消选择技能
    unselectSKill(): void {
        if (this.status.currSkill) {
            let currSkill = this.status.currSkill;
            this.status.currSkill = undefined;

            let data: sanguoDataStruct.IUnselectSkill = {
                chess: this,
                skill: currSkill
            };

            this.fire(sanguoEvent.unselectSkill, data);
        }
    };

    // 获取所选技能可以选择的目标
    getCastablePositionList(): Position[] {
        return undefined;
    };

    // 选择技能目标
    selectCastPosion(position: Position): void {

    };

    // 休息
    rest(): void {
        let data: sanguoDataStruct.IRest = {
            chess: this
        };
        this.fire(sanguoEvent.rest, data);
    };

    // 棋子获取回合
    getTurn(): void {
        let stat = this.status;
        stat.isMoved = false;
        stat.isAttacked = false;
        stat.currSkill = undefined;

    };

    // 获取可以执行的action列表
    getActionList(): EChessAction[] {
        return undefined;
    };

    // 获取技能
    addSkill(skill: Skill): void {
        this.skillList.push(skill);

        let data: sanguoDataStruct.IAddSkill = {
            chess: this,
            skill
        };
        this.fire(sanguoEvent.addSkill, data);
    };

    on(eventName: string, listener: (data: any) => void) {
        let chBoard = this.chessBoard;
        if (chBoard) {
            chBoard.on(eventName, listener);
        }
    };

    fire(eventName: string, data: any) {
        let chBoard = this.chessBoard;
        if (chBoard) {
            chBoard.emit(eventName, data);
        }





    };


    // 接受真实伤害
    // 可以看成简单的生命移除
    acceptDamage(damageAmount: number): void {
        this.hp -= damageAmount;
        if(this.hp<0){
            this.hp =0;
        }

        if(this.hp==0){
            this.die();
        }
    };

    // 死亡
    die():void{
        // todo
        // 记得考虑"地狱领主"那种
    }


}














