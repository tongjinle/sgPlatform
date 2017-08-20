import { EPlatformStatus } from '../struct/enums';
import { User } from './user';
import { Room } from './room';
import * as SocketIO from 'socket.io';
import loger from './loger';


export class Platform {
	userList: User[];
	roomList: Room[];
	status: EPlatformStatus;
	io: SocketIO.Server;

	// 等待被重连的socket
	holdList: { userName: string, ts: number }[];
	// 重连时间
	private holdDuration: number = 5 * 60 * 1000;

	constructor(io: SocketIO.Server) {
		this.userList = [];
		this.roomList = [];
		this.io = io;
		this.holdList = [];

		this.status = EPlatformStatus.Open;

		this.listen();
		this.loopHoldList();
	}

	private listen(): void {
		let io = this.io;
		io.on('connect', so => {
			let us = new User(so, this);
			this.userList.push(us);
			loger.info(`connect::${so.id}`);
		});
	}

	broadcast(eventName: string, ...data: any[]): void {
		this.io.to('platform').emit(eventName, ...data);
	}

	private loopHoldList(): void {
		setInterval(() => {
			let ts = new Date().getTime();
			for (var i = 0; i < this.holdList.length; i++) {
				let ho = this.holdList[i];
				if (ts - ho.ts >= this.holdDuration) {
					this.holdList.splice(i, 1);
					loger.info(`remove hold::${ho.userName}`);
				}
			}
		}, 1000);
	}
};