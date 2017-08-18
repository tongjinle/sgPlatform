import { EPlatformStatus } from '../struct/enums';
import { User } from './user';
import { Room } from './room';
import * as SocketIO from 'socket.io';


export class Platform {
	userList: User[];
	roomList: Room[];
	status: EPlatformStatus;
	io: SocketIO.Server;

	constructor(io: SocketIO.Server) {
		this.userList = [];
		this.roomList = [];
		this.io = io;
		
		this.status = EPlatformStatus.Open;

		this.listen();
	}

	private listen(): void {
		let io = this.io;
		io.on('connect', so => {
			let us = new User(so);
			this.userList.push(us);
		});
	}
};