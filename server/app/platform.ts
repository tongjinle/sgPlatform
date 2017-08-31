import * as Http from 'http';
import {
	EPlatformStatus,
	EGameName,
	EGameInfoType,
	EGameStatus
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
			// loger.debug('loopMatchGame');
			// loger.debug(JSON.stringify(this.matchingList, null, 4));
			_.each(this.matchingList, (list, name) => {
				while (list.length >= 2) {
					let matchedList = list
						.splice(0, 2)
						.map(usName => _.find(this.userList, us => us.userName == usName));

					loger.info(`notiMatchGame::${matchedList.map(us => us.userName).join('&')}`);


					let ro = new Room(EGameName[name], matchedList);
					{
						let notiData: Protocol.INotifyMatchGame = {
							roomId: ro.id,
							playerNameList: ro.playerList.map(pler => pler.userName)
						};
						this.io.to(ro.id).emit('notiMatchGame', notiData);
					}
					this.roomList.push(ro);
					ro.start();
				}
				// notify user MATCHING
				list.forEach(usName => {
					let us = _.find(this.userList, us => us.userName == usName);
					if (us) {
						us.socket.emit('notiMatchingGame');
						loger.info(`notiMatchingGame::${us.userName}`);
					}
				});
			});
			// console.log(JSON.stringify(this.matchingList, null, 4));
		}, 5000);
	}

	afterUserDisconnect(user: User): void {
		// 将掉线的user从matchingList中移除
		{
			this.clearMatchingList(user);
			loger.debug('afterUserDisconnect');
			loger.debug(JSON.stringify(this.matchingList, null, 4));
		}
	}


	afterUserLogout(user: User) {
		this.userList = _.without(this.userList, user);

		// 清理matchingList
		this.clearMatchingList(user);
		// 如果有人退出,则要把游戏自动结束,认为这样是一种投降
		// todo
		// 查找user所在的所有房间,且游戏的状态为'进行中'
		this.roomList.forEach(ro => {
			let ga = ro.game;
			if (ga && ga.status == EGameStatus.Play && ro.playerList.indexOf(user) >= 0) {
				ga.pause();
				ga.afterPlayerLogout(user.userName);
			}
		});
	}


	// 清理matchingList
	private clearMatchingList(user: User): void {
		let map = this.matchingList;
		_.each(map, (list, gameName) => {
			list = list.filter(usName => usName != user.userName);
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