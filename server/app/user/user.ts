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
import eLogin from './eLogin';

export class User {
    // 用户名
    userName: string;
    // 房间列表
    roomList: Room[];
    // 通信socket
    socket: SocketIO.Socket;
    // 平台
    private platform: Platform;
    // 状态
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

        // 未登录状态
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
                'reqUnWatchRoom',
            ].forEach(eventName => {
                so.removeAllListeners(eventName);
            });

            // 监听

            // 登录
            so.on('reqLogin', async (data: Protocol.IReqLogin) => {
                let { userName, password } = data;
                await this.login(userName, password);
            });
        }
        // 登录状态
        else if (EUserStatus.Online == v) {
            // 反监听
            [
                'reqLogin',
            ].forEach(eventName => {
                so.removeAllListeners(eventName);
            });

            // 登出
            so.on('reqLogout', (data: Protocol.IReqLogout) => {
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
            /*
                将自己的用户名userName和游戏匹配数据extData发送给匹配管理器matchMgr
                matchMgr将匹配结果返回
            */
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
                // room存在
                // 而且当前user是在该room中
                if (ro && !!ro.findUser(this.userName)) {
                    let action: GameAction<any> = {
                        playerName: this.userName,
                        actionName,
                        actionData
                    };
                    ro.accpetAction(action);
                }
                else {
                    loger.error(`user::gameAction::ERR ROOMID::${roomId}`);
                }
            });

            // 退出房间
            so.on('reqUserLeaveRoom', (data: Protocol.IReqUserLeaveRoom) => {
                let { roomId } = data;
                let ro = this.platform.roomMgr.findByRoomId(roomId);
                if (ro && !!ro.findUser(this.userName)) {

                }
            });

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

    /**
     * 用户登录
     * @param userName 用户名
     * @param password 密码
     */
    async login(userName: string, password: string): Promise<void> {
        let so = this.socket;
        let pl = this.platform;
        let io = pl.io;

        // 数据库密码
        let Loginflag = await pl.userMgr.login(userName, password, so);
        let flag = ELogin.success === Loginflag;
        let resData: Protocol.IResLogin = { flag, code: Loginflag, };
        so.emit('resLogin', resData);

        if (flag) {
            this.userName = userName;
            this.joinPlatform();
            this.status = EUserStatus.Online;

            let notiData: Protocol.INotifyLogin = { userName, };
            pl.broadcast('notiLogin', notiData);

            // 查看是否是重连的断线用户
            let ho = pl.holderMgr.find(userName);
            if (ho) {
                this.reconnect();
            }

        }

        loger.info(`user::login::${userName}::${ELogin[Loginflag]}::${this.socket.id}`);
    }

    /**
     * 登出
     */
    async logout(): Promise<void> {
        let so = this.socket;
        let pl = this.platform;
        let io = pl.io;

        let flag: boolean;
        if (EUserStatus.Online == this.status) {
            this.status = EUserStatus.Offline;

            let logoutFlag = await pl.userMgr.logout(this.userName);

            flag = logoutFlag == ELogout.success;
            let resData: Protocol.IResLogout = { flag };
            so.emit('resLogout', resData);
            if (flag) {
                // 清除对应的断线用户
                pl.holderMgr.remove(this.userName);
                // 离开平台
                this.leavePlatform();
                // 断开socket
                so.disconnect();
                // 通知客户端 平台中有用户登出
                let notiData: Protocol.INotifyLogout = { userName: this.userName };
                pl.broadcast('notiLogout', notiData);
            }
            loger.info(`user::logout::${this.userName}::${this.socket.id}::${flag}`);
        }
    }

    /**
     * 世界聊天
     * @param message 聊天信息
     */
    chatToWorld(message: string): void {
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

    /**
     * 房间聊天
     * @param message 聊天信息
     * @param roomId 房间id
     */
    chatToRoom(message: string, roomId: string): void {
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

    /**
     * 私密聊天
     * @param message 聊天信息
     * @param userName 聊天对象的用户名
     */
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

    /**
     * 加入平台
     */
    private joinPlatform(): void {
        this.socket.join('platform');
    }

    /**
     * 离开平台
     */
    private leavePlatform(): void {
        this.socket.leave('platform');
        // 离开所有房间
        this.leaveAllRooms();
        // 退出匹配
        let pl = this.platform;
        let matchList = pl.matchMgr.findById(this.userName);
        matchList.forEach(ma => {
            pl.matchMgr.remove(ma.gameName, ma);
        });
    }

    /**
     * 加入房间
     * @param roomId 房间id
     */
    joinRoom(roomId: string) {
        let mgr = this.platform.roomMgr;
        let roAdd = mgr.findByRoomId(roomId);
        // 房间存在
        // 不在当前用户的房间列表中
        // 房间的用户列表中不存在当前用户
        if (roAdd) {
            let flag = !roAdd.findUser(this.userName);

            if (flag) {
                roAdd.join(this);
            }
        }
    }

    // 
    /**
     * 离开房间
     * @param roomId 房间id
     */
    leaveRoom(roomId: string): void {
        // 房间存在
        // 房间存在在当前用户房间列表中
        // 当前用户存在在房间的用户列表中
        let roRemove = this.platform.roomMgr.findByRoomId(roomId);
        if (roRemove) {
            let flag = !!roRemove.findUser(this.userName);
            if (flag) {
                roRemove.leave(this);
            }
        }
    }

    /**
     * 离开所有房间
     */
    leaveAllRooms(): void {
        this.roomList.forEach(ro => {
            this.leaveRoom(ro.id);
        });
    };

    // todo
    // 观战
    watchRoom(roomId: string) {

    }

    // todo
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
            if (this.status != EUserStatus.Online) {
                let mgr = pl.userMgr;
                mgr.remove(this);
                return;
            }

            // 加入等待重连的列表
            {
                let mgr = pl.holderMgr;
                let userName = this.userName;
                let roomIdList = this.roomList.map(ro => ro.id);
                mgr.add(userName, roomIdList);
            }

            // 登出
            {
                // 离开平台
                this.leavePlatform();
                // 删除用户
                let mgr = pl.userMgr;
                mgr.remove(this);
            }

            // 发送“断线”信息给客户端
            let notiData: Protocol.INotifyDisconnect = { userName: this.userName };
            io.emit('notiDisconnect', notiData);


            loger.info(`disconnect : ${this.userName}`);

        });
    }

    /**
     * 重连
     */
    reconnect(): void {
        let pl = this.platform;
        let mgr = pl.holderMgr;

        // 存在断线用户
        // 断线用户尚未超出重连时间
        // 进入所有房间
        let ho = mgr.find(this.userName);
        loger.debug(JSON.stringify(ho));
        if (ho && !mgr.isOvertime(ho)) {
            mgr.remove(this.userName);
            ho.roomIdList.forEach(roId => {
                this.joinRoom(roId);
            });
            loger.info(`user::reconnect::${this.userName}::${this.socket.id}`);
        }



    }
}

