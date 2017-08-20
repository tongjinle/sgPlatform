import * as io from "socket.io-client";
import * as _ from 'underscore';
import * as async from 'async';

let watcher;
let watchedList: { userName: string, status: boolean }[] = [];
let soList: { [userName: string]: SocketIOClient.Socket } = {};

let createSocket = () => {
	let port = 1216;

	let opts: SocketIOClient.ConnectOpts = {
		reconnection: false,
		// autoConnect:false,
		forceNew: true
	};
	let so: SocketIOClient.Socket = io("http://localhost:1216", opts);

	return so;
};



let createWatcher = () => {
	watcher = createSocket();
	watcher.emit('reqLogin', { userName: 'watcher', password: 'falcon' });
	watcher.on('notiLogin', data => {
		let { userName } = data;
		let us = _.find(watchedList, us => us.userName == userName);
		if (us) {
			us.status = true;
		} else {
			watchedList.push({ userName, status: true });

		}
	});

	watcher.on('notiLogout', data => {
		let { userName } = data;
		watchedList = watchedList.filter(n => n.userName != userName);
	});

	watcher.on('notiDisconnect', data => {
		let { userName } = data;
		watchedList.forEach(n => {
			if (n.userName == userName) {
				n.status = false;
			}
		});
	});

	watcher.on('resOnlineUserList', data => {
		console.log(JSON.stringify(data, null, 4));
	});
};



let login = (socket: SocketIOClient.Socket, userName: string) => {
	socket.emit('reqLogin', { userName, password: 'falcon' });
};

let logout = (socket: SocketIOClient.Socket) => {
	socket.emit('reqLogout');
};

let clear = (cb) => {
	watchedList = [];
	_.each(soList, so => {
		logout(so);
	});

	setTimeout(cb, 5000);
};

let testList = [];
testList.push((cb) => {
	let userNameList = ['a', 'b', 'c'];

	async.series([
		cb => {
			userNameList.forEach(usName => {
				let so = createSocket();
				soList[usName] = so;
				login(so, usName);
			});
			setTimeout(cb, 2000);
		},
		cb => {
			soList['b'].disconnect();
			soList['c'].emit('reqLogout');
			setTimeout(cb, 2000);
		},
		cb => {
			// c登出就表示不在
			let c = _.find(watchedList, n => n.userName == 'c');
			console.assert(c === undefined);

			// b断线,那么其userName还在服务器内存中
			let b = _.find(watchedList, n => n.userName == 'b');
			console.assert(b && b.status == false);

			cb();
		},
		cb => {
			let usName = 'b';
			let so = soList[usName] = createSocket();
			login(so, usName);
			setTimeout(cb, 2000);

		},
		cb => {
			// b重新登录
			let b = _.find(watchedList, n => n.userName == 'b');
			console.assert(b.status == true);
			cb();
		},
		cb => {
			console.log(JSON.stringify(watchedList, null, 4));
			cb();
		}
	], clear.bind(null, cb));



});

createWatcher();
setTimeout(() => {

	async.eachSeries(testList, (te, cb) => te(cb), () => {
		console.log('test complete');
	});

}, 2000);



