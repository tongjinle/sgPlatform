import * as SocketIO from 'socket.io';
import loger from '../loger';
import { User } from './user';
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
    find(socketId: string): User {
        return _.find(this.userList, us => us.socket.id == socketId);
    }

    // 通过socketiId删除user
    remove(socketId: string): boolean {
        let user = this.find(socketId);
        if (user) {
            this.userList = this.userList.filter(us => us != user);
            loger.info(`disconnect::${socketId}`);
            return true;
        }
        return false;
    }
}