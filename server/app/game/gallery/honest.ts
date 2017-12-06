import { Game, GameAction, IGameInitData } from '../game';
import { Player } from '../../user/player';
import * as _ from 'underscore';
import loger from '../../loger';
import * as Protocol from '../../../struct/protocol';


enum EStatus {
    beforeChat,
    chat,
}

// 问答阶段的子状态
enum ESubStatusOfBeforeChat {

}

// 主观题，客观题
enum EQuestionType {
    objective,
    subjective,
}

// 回答对象
enum EAnswerRole {
    all,
    boy,
    girl,
}


export interface IHonestGameInitData extends IGameInitData {
    boy: string,
    girl: string,
}


// 用户可能的action
// 回答
// 申请问题
// 聊天
// 加时间


interface IAskData {
    question: {
        desc: string,
        type: EQuestionType,
        role: EAnswerRole,
        answerList?: {
            answer: string,
            tagList?: string[]
        }[],
    },
    cache?: {
        boy?: string | number,
        girl?: string | number,
    }
};

interface IAnswerData {
    answer?:string|number,
    isCache?:boolean,
}



export class HonestGame extends Game {
    // 亲密度
    intimacy: number;

    // 剩余时间
    // 默认为3分钟
    duration: number;



    // 状态
    honestStatus: EStatus;


    private loopHandle;

    // 回答了的username列表
    private answered: string[];

    // 问答阶段经历的次数
    private beforeChatCount: number;
    private totalBeforeChatCount: number;

    // 可以问答
    private canAsk: boolean;

    constructor(initData: IHonestGameInitData) {
        super(initData);

        this.intimacy = 0;
        this.duration = 3 * 60 * 1000;
        this.honestStatus = EStatus.beforeChat;
        this.answered = [];
        this.beforeChatCount = 0;
        this.totalBeforeChatCount = 5;
        this.canAsk = true;

        // checkActionHandlerList
        this.checkActionHandlerList.push((action: GameAction<IAnswerData>) => {
            return true;
        });

        // this.parseActionHandlerList
        this.parseActionHandlerList['answer']=(action:GameAction<IAnswerData>)=>{

        };
    }


    private loop() {
        // 自动问答
        let autoAsk = () => {
            if (EStatus.beforeChat == this.honestStatus && this.canAsk) {
                this.ask();
            }
        };

        this.loopHandle =setInterval(() => {
            autoAsk();
        }, 1000);
    }

    // 提问
    private ask() {
        let data: GameAction<IAskData> = {
            playerName: 'system',
            actionName: 'ask',
            actionData: this.getQuestion(),
        };
        this.room.notifyAll('notiGameAction', data);
        this.canAsk = false;
    }

    // 获取问题
    private getQuestion(): IAskData {
        return undefined;
    }

}



// 首先双方回答5个真心话问题，每个真心话问题亲密度+3
// 而后进入自由聊天阶段
// 自由聊天阶段可以请求真心话问题，对方如果回答了，亲密度+5
// 聊天每超过3分钟，亲密度+10
// girl可以申请加时间，每次可以加5分钟
// 每次时间不够1分钟的时候，自动提醒girl
// 亲密度到80，自动提醒交换联系方式