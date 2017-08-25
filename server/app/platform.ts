import * as Http from 'http';
import {
	EPlatformStatus,
	EGameName,
	EGameInfoType
} from '../struct/enums';
import { User } from './user';
import { Player } from './user/player';
import { Watcher } from './user/watcher';
import { Room } from './room';
import * as SocketIO from 'socket.io';
import loger from './loger';
import * as _ from 'underscore';
import * as Protocol from '../struct/protocol';


export class Platform {
	userList: User[];
	roomList: Room[];
	status: EPlatformStatus;
	io: SocketIO.Server;


	// 在等待匹配的用户列表
	matchingList: { [gameName: string]: string[] };
	// 等待被重连的socket
	holdList: { userName: string, ts: number }[];
	// 重连时间
	private holdDuration: number = 5 * 60 * 1000;

	private constructor(io: SocketIO.Server) {
		this.userList = [];
		this.roomList = [];
		this.io = io;
		this.holdList = [];
		this.matchingList = {};

		this.status = EPlatformStatus.Open;

		this.listen();
		this.loopHoldList();
		this.loopMatchGame();

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


	private loopMatchGame(): void {
		setInterval(() => {
			let ts = Date.now();
			_.each(this.matchingList, (list, name) => {
				while (list.length >= 2) {
					let matchedList = list
						.splice(0, 2)
						.map(usName => _.find(this.userList, us => us.userName == usName));
					let ro = new Room(EGameName[name], matchedList);
					this.roomList.push(ro);
					ro.start();
				}
			});
		});
	}

	private static plSingle: Platform;
	static getInstance(): Platform {
		if (Platform.plSingle) { return Platform.plSingle; }

		const PORT = 1216;
		let ret: Platform;
		let serv = Http.createServer();
		let io = SocketIO(serv);
		ret = new Platform(io);


		serv.listen(PORT, () => {
			let addrInfo = serv.address();
			loger.info(`server address : ${addrInfo.address}`);
			loger.info(`server port : ${addrInfo.port}`);
			loger.info(`start server at ${new Date().toTimeString()}`);
		});

		Platform.plSingle = ret;
		return ret;
	};

};