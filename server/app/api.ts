import * as Http from 'http';
import { Platform } from './platform';
import { Room } from './Room';
import { Game } from './game';
import { User } from './user';
import * as SocketIO from 'socket.io';
import { EPlatformStatus, EUserStatus, EGameStatus } from '../struct/enums';
import loger from './loger';
import * as _ from 'underscore';




let plSingle: Platform;

export namespace API {
	export function test() {
		console.log('test world');
	};


	// 创建平台
	export function createPlatform(): Platform {
		if (plSingle) { return plSingle; }

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

		plSingle = ret;
		return ret;
	};


	// 用户登录
	export function loginUser(socket: SocketIO.Socket, platform: Platform, userName: string, password: string): boolean {
		let ret: boolean;
		let isExist = platform.userList.some(us => us.userName == userName);
		if (isExist) { return false; }

		// mock
		// todo
		let us = _.find(platform.userList, us => us.socket == socket);
		us.userName = userName;
		us.status = EUserStatus.Online;
		ret = true;
		return ret;
	}


	// 用户登出
	export function logoutUser(socket: SocketIO.Socket, platform: Platform, userName: string): boolean {
		let ret: boolean;
		let us = _.find(platform.userList, us => us.userName == userName && us.status == EUserStatus.Online);
		ret = !!us;
		if (us) {
			platform.userList = _.without(platform.userList, us);
			us.status = EUserStatus.Offline;
		}
		return ret;
	}

	// 获取在线用户
	export function onlineUserList(platform: Platform): User[] {
		let ret = platform.userList.filter(us => us.status == EUserStatus.Online);
		return ret;
	}


}