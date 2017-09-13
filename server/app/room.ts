import { EGameName } from '../struct/enums';
import { User } from './user';
import { Game, GameAction } from './game';
import { Player } from './user/player';
import { Watcher } from './user/watcher';
import { Sanguo } from './game/sanguo/index';
import { TestGame } from './game/testGame';
import loger from './loger';
import { Platform } from './platform';
import * as Protocol from '../struct/protocol';
import * as _ from 'underscore';


export class Room {
    id: string;
    playerList: User[];
    maxPlayerCount: number;
    watcherList: User[];
    maxWatcherCount: number;
    canWatch: boolean;
    canPlay: boolean;
    gameName: EGameName;
    game: Game;



    constructor(gameName: EGameName, playerList: User[]) {
        this.id = _.uniqueId();
        this.gameName = gameName;
        this.playerList = playerList;
        this.watcherList = [];

        this.canWatch = true;
        this.canPlay = true;

        // join room
        this.playerList.forEach(us => {
            us.socket.join(this.id);
        });

        // create game;
        let ga = this.game = this.createGame(gameName);
        ga.room = this;
        // push player;
        this.playerList.forEach(us => {
            let plName = us.userName;
            let pler = new Player(plName);
            ga.playerList.push(pler);
        });
    };


    // 开始
    start(): void {
        let ga = this.game;
        if (ga) {
            ga.start();
        } else {
            loger.error(`room::${this.id}::ERR NO GAME`);
        }
    };


    addPlayer(user: User): void {
        this.playerList.push(user);
        user.socket.join(this.id);
    };

    removePlayer(user: User): void {
        this.playerList = this.playerList.filter(pler => pler != user);
        user.socket.leave(this.id);
    };

    addWatcher(user: User): void {
        this.watcherList.push(user);
        user.socket.join(this.id);
    };

    removeWatcher(user: User): void {
        this.watcherList = this.watcherList.filter(wa => wa != user);
        user.socket.leave(this.id);
    };

    // 工厂
    private createGame(gameName: EGameName): Game {
        if (EGameName.Sanguo == gameName) {
            return new Sanguo();
        }
        else if (EGameName.TestGame == gameName) {
            return new TestGame();
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
        }
    };

    // 
    resWatcher(watcherName: string, event: string, ...data: any[]) {
        this.watcherList.some(wa => {
            if (wa.userName == watcherName) {
                wa.socket.emit(event, ...data);
                return true;
            }
        });
    };

    // 反馈action的操作结果给发起action的player
    // 一般来说,就是反馈一个布尔值,表示是不是action被执行
    resPlayer(playerName: string, event: string, ...data: any[]) {
        this.playerList.some(pler => {
            if (playerName == pler.userName) {
                pler.socket.emit(event, ...data);
                return true;
            }
        });
    };


    // 通知给所有对战者和观战者
    notifyAll(event: string, ...args: any[]) {
        let pl = Platform.getInstance();
        let io = pl.io;
        io.to(this.id).emit(event, ...args);

        loger.info(`room::notifyAll::${event}`);
    }


    // 结束
    end(data: Protocol.INotifyGameEnd<any>): void {
        this.game.end();
        this.notifyAll('notiGameEnd', data);
    }
}