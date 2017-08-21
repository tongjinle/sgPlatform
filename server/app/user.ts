import { EPlatformStatus, EUserStatus, EGameStatus, EChatType } from '../struct/enums';
import { Platform } from './platform';
import { Room } from './Room';
import { Game } from './game';
import * as SocketIO from 'socket.io';
import * as Protocol from '../struct/protocol';
import { API } from './api';
import loger from './loger';
import * as _ from 'underscore';


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
			// 离开所有房间
			so.leaveAll();

			// 反监听
			['reqLogout', 'reqOnlineUserList'].forEach(eventName => {
				so.removeAllListeners(eventName);
			});

			// 登陆
			so.on('reqLogin', (data: Protocol.IReqLoginData) => {
				let { userName, password } = data;
				let flag = API.loginUser(so, pl, userName, password);
				let resData: Protocol.IResLoginData = { flag };
				so.emit('resLogin', resData);
				if (flag) {
					this.status = EUserStatus.Online;

					let notiData: Protocol.INotifyLoginData = { userName };
					pl.broadcast('notiLogin', notiData);

					// 查看是否是重连
					if (pl.holdList.some(ho => ho.userName == userName)) {
						pl.holdList = pl.holdList.filter(ho => ho.userName != userName);
						loger.info(`reconnect::${userName}`);
						this.reconnect();
					}
				}

				loger.info(`login::${userName}::${flag}`);
			});
		} else if (EUserStatus.Online == v) {
			// 进入platform房间
			so.join('platform');

			// 反监听
			so.removeAllListeners('reqLogin');

			// 登出
			so.on('reqLogout', (data: Protocol.IReqLogoutData) => {
				let flag: boolean = API.logoutUser(so, pl, this.userName);
				let resData: Protocol.IResLogoutData = { flag };
				so.emit('resLogout', resData);
				if (flag) {
					let notiData: Protocol.INotifyLogoutData = { userName: this.userName };
					pl.broadcast('notiLogout', notiData);
					so.disconnect();
				}
				loger.info(`logout::${this.userName}::${flag}`);

			});

			// 获取当前在线用户列表
			so.on('reqOnlineUserList', (data: Protocol.IReqOnlineUserList) => {
				let flag: boolean = false;
				let resData: Protocol.IResOnlineUserList;
				if (EPlatformStatus.Open == pl.status) { flag = true; }

				if (flag) {
					let list = API.onlineUserList(pl).map(us => {
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
				let ts = new Date().getTime();
				let flag: boolean = false;
				let from = this.userName;
				let notiData: Protocol.INotifyChat = {
					from,
					type,
					message,
					timestamp: ts
				};
				let resData: Protocol.IResChat;
				if (EChatType.Platform == type) {
					flag = true;
					pl.broadcast('notiChat', notiData);
					loger.info(`platform chat::${from}::${message}`);
				}
				else if (EChatType.Room == type) {
					// 判断是不是在这个房间里
					let usListInRoom = so.rooms[roomId];
					flag = !!usListInRoom;
					if (flag) {
						io.to(roomId).emit('notiChat', notiData);
						loger.info(`room chat::${roomId}::${from}::${message}`);
					}
				}
				else if (EChatType.Personal == type) {
					let soId: string;
					let us = _.find(pl.userList, us => us.userName == to);
					flag = !!us;
					if (flag) {
						soId = us.socket.id;
						let targetSo = io.sockets.sockets[soId];
						if(!targetSo){
							loger.debug(us.userName);
							loger.debug(us.socket.id);
							loger.debug(Object.keys(io.sockets.sockets).join('\n'));
							loger.debug('...');
							loger.debug(pl.userList.map(us => us.userName).join('\n'));
						}else{
							targetSo.emit('notiChat', notiData);
						}

						//聊天发送者必然应该被notify
						so.emit('notiChat', notiData);
						loger.info(`personal chat::${from} => ${to}::${message}`);
					}
				}
				so.emit('resChat', resData);
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

	// 加入房间
	joinRoom(roomId: string) {

	}

	// 离开房间
	leaveRoom(roomId: string) {

	}

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
			if (this.status == EUserStatus.Online && pl.userList.some(us => us.socket == so)) {
				let notiData: Protocol.INotifyDisconnectData = { userName: this.userName };
				io.emit('notiDisconnect', notiData);

				this.status = EUserStatus.Offline;

				loger.info(`disconnect : ${this.userName}`);

				pl.holdList.push({ userName: this.userName, ts: new Date().getTime() });
			}
		});


	}









	// 重连
	reconnect(): void { }
}

