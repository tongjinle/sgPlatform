import { ESkillType, Skill } from './skill';
import { Position } from './position';


// 主动技能
export class ActiveSkill extends Skill {
    cd: number;
    maxCd: number;


    constructor() {
        super();

        this.type = ESkillType.active;
    }


    // 获取技能可以选择的目标
    getTargetPositionList(): Position[] {
        return undefined;
    }

    // 使用技能
    castSkill(position: Position): void {
        this.cd = this.maxCd;
    }

    // 是否可以使用技能
    canCastSkill(): boolean {
        let flag: boolean = true;
        // 技能点
        if (this.owner.skillPoint == 0) {
            return false;
        }
        // cd
        if (this.cd != 0) {
            return false;
        }
        // 是否有施法目标
        {
            let list = this.getTargetPositionList();
            if (!list || list.length == 0) {
                return false;
            }
        }
        return flag;
    }
}