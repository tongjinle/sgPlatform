import { EGameName, EGameStatus } from '../../struct/enums';
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
import ERoomStatus from './eRoomStatus';
import { EventEmitter } from 'events';
import ERoomEvent from './eRoomEvent';

export interface IRoomJoin {
    userName: string,
    roomId: string,
};

export interface IRoomLeave {
    userName: string,
    roomId: string,
};

export class Room extends EventEmitter {
    id: string;
    maxPlayerCount: number;
    maxWatcherCount: number;
    canWatch: boolean;
    canPlay: boolean;
    gameName: EGameName;
    game: Game;

    private userList: User[];
    private watcherList: User[];



    constructor(gameName: EGameName, userList: User[], initData: IGameInitData) {
        super();

        this.id = _.uniqueId();
        this.gameName = gameName;
        this.userList = userList;
        this.watcherList = [];

        // listen
        this.listen();

        // join room
        this.userList.forEach(us => {
            this.join(us);
        });

        // create game;
        let gameCls = GameMap[gameName];
        let ga = this.game = new gameCls();
        ga.playerList.push(...this.userList.map(us => new Player(us.userName)));
        ga.room = this;
        ga.parseInitData(initData);
        ga.emit(EGameEvent.afterParseInitData, initData);

    };

    private listen(): void {
        // 通知game有user进入房间
        this.on(ERoomEvent.join, (data: IRoomJoin) => {
            let ga = this.game;
            if (ga) {
                ga.onUserJoin(data.userName);
            }
        });

        // 通知game有user离开房间
        this.on(ERoomEvent.leave, (data: IRoomLeave) => {
            let ga = this.game;
            if (ga) {
                ga.onUserLeave(data.userName);
            }
        });
    }


    // 开始
    start(): void {
        let ga = this.game;
        if (ga) {
            loger.info(`room::start::${this.id}::${EGameName[this.gameName]}`)
            ga.start();
        }
    }

    /**
     * 查找房间中的用户
     * @param userName 待查找的用户名
     */
    findUser(userName: string): User {
        return this.userList.find(us => us.userName == userName);
    }

    /**
     * 用户进入房间
     * @param user 进入房间的用户
     */
    join(user: User): void {
        this.userList.push(user);
        user.roomList.push(this);
        user.socket.join(this.id);

        let notiData: Protocol.INotifyJoinRoom = {
            userName: user.userName,
            roomId: this.id,
        };
        this.notifyAll('notiJoinRoom', notiData);

        // 发送事件
        {
            let userName = user.userName;
            let roomId = this.id;
            let data: IRoomJoin = { userName, roomId };
            this.emit(ERoomEvent.join, data);
        }

        loger.info(`room::joinRoom::${user.userName}::${user.socket.id}::${this.id}`);
    }

    /**
     * 用户离开房间
     * @param user 离开房间的用户
     */
    leave(user: User): void {
        this.userList = this.userList.filter(us => us != user);
        user.roomList = user.roomList.filter(ro => ro != this);
        user.socket.leave(this.id);

        let notiData: Protocol.INotifyLeaveRoom = {
            userName: user.userName,
            roomId: this.id,
        };
        this.notifyAll('notiLeaveRoom', notiData);


        // 发送事件
        {
            let userName = user.userName;
            let roomId = this.id;
            let data: IRoomLeave = { userName, roomId };
            this.emit(ERoomEvent.leave, data);
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
        loger.info(`room::notifyAll::${event}:${args ? JSON.stringify(args) : ''}`);
    }

    // 暂停
    pause(): void {


    }

    // 重新开始
    resume(): void {

    }

    // 结束
    end(): void {
        // todo
        this.removeAllListeners();
    }
}