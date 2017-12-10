import { EGameName } from '../../struct/enums';
import { User } from '../user/user';
import { IGameInitData, Game, GameAction, EGameEvent, } from '../game/game';
import GameMap from '../game/gameMap';
// import { createGame } from '../game/gameUtil';
import { Player } from '../user/player';
import { Watcher } from '../user/watcher';
import loger from '../loger';
import { Platform } from '../platform';
import * as Protocol from '../../struct/protocol';
import * as _ from 'underscore';


export class Room {
    id: string;
    userList: User[];
    maxPlayerCount: number;
    watcherList: User[];
    maxWatcherCount: number;
    canWatch: boolean;
    canPlay: boolean;
    gameName: EGameName;
    game: Game;



    constructor(gameName: EGameName, userList: User[], initData: IGameInitData) {
        this.id = _.uniqueId();
        this.gameName = gameName;
        this.userList = userList;
        this.watcherList = [];

        // join room
        this.userList.forEach(us => {
            us.socket.join(this.id);
        });

        // create game;
        let gameCls = GameMap[gameName];
        let ga = this.game = new gameCls();
        ga.playerList.push(...this.userList.map(us => new Player(us.userName)));
        ga.room = this;
        ga.parseInitData(initData);
        ga.emit(EGameEvent.afterParseInitData, initData);

    };


    // 开始
    start(): void {
        let ga = this.game;
        if (ga) {
            ga.start();
        }
    }


    // 接受游戏操作信息
    accpetAction(action: GameAction<any>): void {
        let ro = this;
        let ga = this.game;

        let { playerName, actionName, actionData } = action;
        loger.info(`acceptAction::${ro.id}::${playerName}::${actionName}::${JSON.stringify(actionData)}`);

        let checkRet: { flag: boolean, reason: string };
        let flag: boolean = ga.checkAction(action);

        ro.resPlayer(playerName, 'resGameAction', { flag });

        if (flag) {
            ga.parseAction(action);
            let resData = { flag: true };
            ro.notifyAll('notiGameUpdate', ga.updateValueList[ga.updateValueList.length - 1]);
        }
    };

    // 反馈action的操作结果给发起action的player
    // 一般来说,就是反馈一个布尔值,表示是不是action被执行
    resPlayer(userName: string, event: string, ...data: any[]) {
        this.userList.some(us => {
            if (userName == us.userName) {
                us.socket.emit(event, ...data);
                return true;
            }
        });
    };


    // 通知给所有对战者和观战者
    notifyAll(event: string, ...args: any[]) {
        let pl = Platform.getInstance();
        let io = pl.io;
        io.to(this.id).emit(event, ...args);
    }


    // 结束
    end(): void {
        // todo
    }
}