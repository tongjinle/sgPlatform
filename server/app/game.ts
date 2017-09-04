import { EGameStatus, EGameName } from '../struct/enums';
import { Player } from './user/player';
import { Room } from './room';
import * as _ from 'underscore';
import loger from './loger';
import * as Protocol from '../struct/protocol';
import * as SRnd from 'seedrandom';

export interface IGameResult {

};

export class GameAction<T> {
    playerName: string;
    actionName: string;
    actionData: T;
};

export class Game {
    // 编号
    id: string;
    // 玩家列表
    playerList: Player[];
    // 最大玩家人数
    static maxPlayerCount: number;
    // 随机种子
    seed: number;
    // 游戏所属的房间
    room: Room;
    // 游戏状态
    status: EGameStatus;
    // 开始时间戳
    startTimestamp: number;
    // 结束时间戳
    endTimestamp: number;
    // 游戏结果
    result: IGameResult;
    // 初始状态
    initValue: any;
    // 当前状态
    currValue: any;
    // '真实'操作列表
    realActionList: GameAction<any>[];
    // 状态更新列表
    updateValueList: any[];
    // 是否是复盘状态
    isReplay: boolean;

    // 随机种子发生器
    protected seedGenerator: SRnd.prng;
    // 当前回合数
    protected turnIndex: number;
    // 检验操作是否合理
    protected checkActionHandlerList: ((action: GameAction<any>) => boolean)[];
    // 处理操作列表
    protected parseActionHandlerList: { [actionName: string]: (action: GameAction<any>) => void };

    constructor() {
        this.id = _.uniqueId();
        this.seed = 10000;
        this.seedGenerator = SRnd(this.seed.toString());
        this.playerList = [];
        this.checkActionHandlerList = [];
        this.parseActionHandlerList = {};
        this.updateValueList = [];
        this.status = EGameStatus.Prepare;
        this.turnIndex = -1;

        // check init
        this.initCheckActionHandlerList();
    };

    private initCheckActionHandlerList(): void {
        let list = this.checkActionHandlerList;

        // 游戏不在play的状态
        list.push((action: GameAction<any>) => {
            let flag = this.status == EGameStatus.Play;
            if (!flag) {
                loger.error(`game::check::ERR NOT PLAY STATUS`);
            }
            return flag;
        });

        // 没有行棋者 或者 非行棋者发出请求
        list.push((action: GameAction<any>) => {
            let pler = this.playerList[this.turnIndex];
            let flag = pler && pler.isTurn;
            if (!flag) {
                loger.error(`game::check::ERR NO SUCH PLAYER OR NOT TURN`);
            }
            return flag;
        });


    }

    // 开始游戏
    start(): void {
        this.status = EGameStatus.Play;
        this.playerList.forEach(pler=>{
        	pler.isOffline = false;
        });
        
        let ro = this.room;
        let notiData: Protocol.INotifyGameStart = {
            roomId: ro.id,
            gameName: ro.gameName,
            playerNameList: ro.playerList.map(pler => pler.userName)
        };

        ro.notifyAll('notiGameStart', notiData);
        loger.info(`game::start::${ro.id}::${EGameName[ro.gameName]}`);

        this.notifyTurn();
    };


    protected notifyTurn(): void {
        this.turn();

        let pler = _.find(this.playerList, pler => pler.isTurn);
        if (pler) {
            let plNameInTurn = pler.userName;
            let ro = this.room;
            let notiData: Protocol.INotifyGameTurn = {
                roomId: ro.id,
                playerName: plNameInTurn,
                turnIndex: this.turnIndex
            };
            ro.notifyAll('notiGameTurn', notiData);
            loger.info(`game::notifyGameTurn::${JSON.stringify(notiData)}`);
        }
        else {
            loger.error(`game::notifyTurn::${this.playerList.map(pl => pl.userName + '==' + pl.isTurn).join('\n')}`);
        }
    }

    // 获取当前回合的选手
    // 需要具体的游戏去重写这个方法
    protected turn(): string { return undefined; };


    // 检验玩家发出的游戏操作
    checkAction(action: GameAction<any>): boolean {
        let ret: boolean;
        let list = this.checkActionHandlerList;
        return list.every(handler => handler(action));
    };



    // 处理游戏操作信息
    parseAction(action: GameAction<any>): void {
        console.log(action.actionName);
        console.log(Object.keys(this.parseActionHandlerList).join('=='));

        let list = this.parseActionHandlerList;
        let handler = list[action.actionName];
        if (handler) {
            handler(action);
        }
    };


    // 暂停游戏
    pause(): void {
        this.status = EGameStatus.Pause;
        this.notifyStatusChanged();
    };

    // 恢复游戏
    resume(): void {
        this.status = EGameStatus.Play;
        this.notifyStatusChanged();
    };


    // 结束游戏
    end(): void {
        this.status = EGameStatus.End;
        this.notifyStatusChanged();

        // 通知游戏结果
        {
            let ro = this.room;
            let notiData: Protocol.INotifyGameEnd<IGameResult> = {
                roomId: ro.id,
                data: this.result
            };
            loger.debug(JSON.stringify(notiData, null, 4));
            this.room.notifyAll('notiGameEnd', notiData);
        }

    };

    // 当玩家掉线的时候
    // 需要具体的游戏去重写这个方法
    afterPlayerDisconnect(playerName: string): void { 
    	let pler =_.find( this.playerList,pler=>pler.userName==playerName);
    	if(pler){
    		pler.isOffline=true;
    	}
    };

    // 当玩家logout的时候
    // 需要具体的游戏去重写这个方法
    afterPlayerLogout(playerName: string): void { };

    // 玩家重连
    afterPlayerReconnect(playerName: string): void {
        let pler = _.find(this.playerList, pler => pler.userName == playerName);
        if (pler) {
            pler.isOffline = false;
        }
    };

    protected notifyStatusChanged() {
        let ro = this.room;
        let data: Protocol.INotifyGameStatusChanged;
        data = {
            status: this.status
        };
        ro.notifyAll('notiGameStatusChanged', data);
    }


}