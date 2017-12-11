import {
    EPlatformStatus,
    EUserStatus,
    EGameStatus,
    EChatType,
    EGameName
} from '../../struct/enums';
import { Platform } from '../platform';
import { Room } from '../room/room';
import RoomMgr from '../room/roomMgr';
import * as SocketIO from 'socket.io';
import * as Protocol from '../../struct/protocol';
import loger from '../loger';
import * as _ from 'underscore';
import { Game, GameAction } from '../game/game';

import EMatch from '../match/eMatch';
import IMatchInfo from '../match/iMatchInfo';

import ELogin from './eLogin';
import ELogout from './eLogout';

export class User {
    userName: string;
    roomList: Room[];
    socket: SocketIO.Socket;

    private platform: Platform;

    private _status: EUserStatus;
    public get status(): EUserStatus {
        return this._status;
    }
    public set status(v: EUserStatus) {
        if (this._status == v) { return; }

        this._status = v;

        let so = this.socket;
        let pl = this.platform;
        let io = pl.io;

        if (EUserStatus.Offline == v) {
            // 反监听
            [
                'reqLogout',
                'reqOnlineUserList',
                'reqChat',

                'reqMatchGame',
                'reqGameAction',
                'reqJoinRoom',
                'reqLeaveRoom',
                'reqWatchRoom',
                'reqUnWatchRoom'
            ].forEach(eventName => {
                so.removeAllListeners(eventName);
            });

            // 监听
            so.on('reqLogin', async (data: Protocol.IReqLoginData) => {
                let { userName, password } = data;
                await this.login(userName, password);
            });
        }
        else if (EUserStatus.Online == v) {
            // 反监听
            [
                'reqLogin',
                'reqOnlineUserList'
            ].forEach(eventName => {
                so.removeAllListeners(eventName);
            });

            // 登出
            so.on('reqLogout', (data: Protocol.IReqLogoutData) => {
                this.logout();
            });

            // 获取用户
            so.on('reqOnlineUserList', (data: Protocol.IReqOnlineUserList) => {
                let flag: boolean = false;
                let resData: Protocol.IResOnlineUserList;
                flag = true;

                if (flag) {
                    let list = pl.userMgr.userList
                        .filter(us => us.status == EUserStatus.Online)
                        .map(us => {
                            let ret: Protocol.IUserInfo;
                            ret = {
                                userName: us.userName,
                                userStatus: us.status,
                                roomIdList: us.roomList.map(ro => ro.id),
                                gameInfo: undefined
                            };
                            return ret;
                        });
                    resData = { flag: true, list };
                } else {
                    resData = { flag: false, list: undefined };
                }
                so.emit('resOnlineUserList', resData);
            });

            // 聊天
            so.on('reqChat', (data: Protocol.IReqChat) => {
                let { message, type, to, roomId } = data;
                if (EChatType.Platform == type) {
                    this.chatToWorld(message);
                }
                else if (EChatType.Room == type) {
                    this.chatToRoom(message, roomId);
                }
                else if (EChatType.Personal == type) {
                    this.chatToPerson(message, to);
                }
            });

            // 匹配游戏
            so.on('reqMatchGame', (data: Protocol.IReqMatchGame) => {
                let { name, extData, } = data;
                let flag: boolean = false;
                let resData: Protocol.IResMatchGame;
                let reason: string = '';

                let gameName = EGameName[name];
                let mgr = pl.matchMgr;
                let info: IMatchInfo = {
                    id: this.userName,
                    gameName,
                    data: extData,
                };

                let matchFlag = mgr.add(gameName, info);
                flag = matchFlag == EMatch.success;
                resData = { flag, code: matchFlag, };
                so.emit('resMatchGame', resData);
                loger.info(`resMatchGame::${this.userName}::${name}::${flag}::${EMatch[matchFlag]}`);

            });

            // 游戏操作
            so.on('reqGameAction', (data: Protocol.IReqGameAction<any>) => {
                let { roomId, actionName, actionData } = data;
                let ro = this.platform.roomMgr.findByRoomId(roomId);
                if (ro) {
                    let action: GameAction<any> = {
                        playerName: this.userName,
                        actionName,
                        actionData
                    };
                    ro.accpetAction(action);
                }
                else {
                    loger.error(`game::action::ERR ROOMID::${roomId}`);
                }
            });

            // 退出房间

        }
    }

    constructor(socket: SocketIO.Socket, platform: Platform) {
        this.socket = socket;
        this.platform = platform;
        this.userName = undefined;
        this.roomList = [];
        this.status = EUserStatus.Offline;

        this.listen();
    }


    async login(userName: string, password: string): Promise<void> {
        let so = this.socket;
        let pl = this.platform;
        let io = pl.io;

        // 数据库密码
        let Loginflag = await pl.userMgr.login(userName, password, so);
        let flag = [ELogin.success, ELogin.reloginSuccess].indexOf(Loginflag) >= 0;
        let resData: Protocol.IResLoginData = { flag, code: Loginflag, };
        so.emit('resLogin', resData);



        if (flag) {
            this.userName = userName;
            this.joinPlatform();
            this.status = EUserStatus.Online;


            let notiData: Protocol.INotifyLoginData = { userName, };
            pl.broadcast('notiLogin', notiData);


            // 查看是否是重连
            if (ELogin.reloginSuccess == Loginflag) {
                this.reconnect();
            }
            // if (pl.holdList.some(ho => ho.userName == userName)) {
            //     pl.holdList = pl.holdList.filter(ho => ho.userName != userName);
            //     this.reconnect();
            // }

        }

        loger.info(`user::login::${userName}::${ELogin[Loginflag]}::${this.socket.id}`);
    }


    async logout(): Promise<void> {
        let so = this.socket;
        let pl = this.platform;
        let io = pl.io;

        let flag: boolean;
        if (EUserStatus.Online == this.status) {
            this.status = EUserStatus.Offline;

            let logoutFlag = await pl.userMgr.logout(this.userName);
            this.leaveAllRooms();

            flag = logoutFlag == ELogout.success;
            let resData: Protocol.IResLogoutData = { flag };
            so.emit('resLogout', resData);
            if (flag) {
                let notiData: Protocol.INotifyLogoutData = { userName: this.userName };
                pl.broadcast('notiLogout', notiData);
                so.disconnect();
            }
            loger.info(`user::logout::${this.userName}::${this.socket.id}::${flag}`);
        }
    }

    chatToWorld(message: string) {
        let flag = true;
        let from = this.userName;
        let ts = Date.now();
        let notiData: Protocol.INotifyChat = {
            from,
            message,
            timestamp: ts,
            type: EChatType.Platform
        };

        this.socket.emit('resChat', { flag });
        this.platform.io.emit('notiChat', notiData);
        loger.info(`platform chat::${from}::${message}`);
    }

    chatToRoom(message: string, roomId: string) {
        let flag = !!this.socket.rooms[roomId];
        if (flag) {
            let from = this.userName;
            let ts = Date.now();
            let notiData: Protocol.INotifyChat = {
                from,
                message,
                timestamp: ts,
                type: EChatType.Room
            };
            this.platform.io.to(roomId).emit('notiChat', notiData);
            loger.info(`room chat::${roomId}::${from}::${message}`);
        }
        this.socket.emit('resChat', { flag });
    }

    chatToPerson(message: string, userName: string) {
        let so = this.socket;
        let pl = this.platform;
        let io = pl.io;

        let soId: string;
        let userList = pl.userMgr.userList;
        let us = _.find(userList, us => us.userName == userName && us.status == EUserStatus.Online);
        let flag = !!us;
        if (flag) {
            let from = this.userName;
            let ts = Date.now();
            let notiData: Protocol.INotifyChat = {
                from,
                message,
                timestamp: ts,
                type: EChatType.Personal
            };
            soId = us.socket.id;
            let targetSo = io.sockets.sockets[soId];
            if (!targetSo) {
                loger.debug(us.userName);
                loger.debug(us.socket.id);
                loger.debug(Object.keys(io.sockets.sockets).join('\n'));
                loger.debug('...');
                loger.debug(userList.map(us => us.userName).join('\n'));
            } else {
                targetSo.emit('notiChat', notiData);
                //聊天发送者必然应该被notify
                so.emit('notiChat', notiData);
            }

            loger.info(`personal chat::${from} => ${userName}::${message}`);
        }
        this.socket.emit('resChat', { flag });

    }

    // 加入"平台"房间
    private joinPlatform(): void {
        this.socket.join('platform');
    }

    // 离开"平台"房间
    private leavePlatform(): void {
        this.socket.leave('platform');
    }

    // 加入房间
    joinRoom(roomId: string) {
        this.socket.join(roomId);
    }

    // 离开房间
    leaveRoom(roomId: string): void {
        this.roomList = this.roomList.filter(ro => ro.id != roomId);
        this.socket.leave(roomId);
    }

    // 离开所有房间
    leaveAllRooms(): void {
        this.roomList = [];
        this.socket.leaveAll();
    };


    // 观战
    watchRoom(roomId: string) {

    }

    // 离开观战
    unwatchRoom(roomId: string) {

    }


    private listen(): void {
        let so = this.socket;
        let pl = this.platform;
        let io = pl.io;

        // 断线
        // disconnect而且能在内存中找到socket的，才叫断线
        so.on('disconnect', () => {
            let userList = pl.userMgr.userList;
            if (this.status == EUserStatus.Online && userList.some(us => us.socket == so)) {
                let notiData: Protocol.INotifyDisconnectData = { userName: this.userName };
                io.emit('notiDisconnect', notiData);

                this.status = EUserStatus.Offline;

                loger.info(`disconnect : ${this.userName}`);


                // 压入'重连'列表
                // pl.holdList.push({ userName: this.userName, ts: Date.now() });


            }
        });


    }





    // 在线人数
    private listenOnlineUserList(): void {
        let so = this.socket;
        let pl = this.platform;
        let io = pl.io;


    };




    // 重连
    reconnect(): void { }
}

