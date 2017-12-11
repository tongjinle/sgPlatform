import * as SocketIO from 'socket.io';
import loger from '../loger';
import { User } from './user';
import ELogin from './eLogin';
import ELogout from './eLogout';
import { Platform } from '../platform';
import * as _ from 'underscore';

export default class UserMgr {
    userList: User[];
    constructor() {
        this.userList = [];
    }

    // 增加一个user
    add(socket: SocketIO.Socket, platform: Platform): void {
        let us = new User(socket, platform);
        this.userList.push(us);
        loger.info(`connect::${socket.id}`);

    }


    // 通过socketId寻找user
    findBySocketId(socketId: string): User {
        return _.find(this.userList, us => us.socket.id == socketId);
    }

    findByUserName(userName: string): User {
        return _.find(this.userList, us => us.userName == userName);
    }



    // 删除user
    remove(...args: User[]): void {
        this.userList = this.userList.filter(us => args.every(ar => ar != us));
    }


    // 登录
    async login(userName: string, password: string, socket: SocketIO.Socket): Promise<ELogin> {
        if (socket) {
            let us = this.findBySocketId(socket.id);
            if (us) {
                // disconnectUser
                let discUs = this.findByUserName(userName);
                if(discUs){
                    this.remove(discUs);
                    return ELogin.reloginSuccess;
                }
                return ELogin.success;
            }
        }
        return ELogin.fail;
    }

    // 登出
    async logout(userName: string): Promise<ELogout> {
        let us = this.findByUserName(userName);
        if(!us){return ELogout.fail;}

        this.remove(us);
        return ELogout.success;
    }

}











