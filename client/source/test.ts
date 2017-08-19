import * as io from "socket.io-client";
import * as _ from 'underscore';
import * as async from 'async';

let port = 1216;

let opts: SocketIOClient.ConnectOpts = {
	reconnection: false,
	// autoConnect:false,
	forceNew: true
};


let userNameList = ['watcher', 'a', 'b', 'c'];
let soList: { [userName: string]: SocketIOClient.Socket } = {};
userNameList.forEach(usName => {
	let so: SocketIOClient.Socket = io("http://localhost:1216", opts);
	soList[usName] = so;

	so.on('resLogin', data => {
		let { flag } = data;
		console.log(`resLogin: ${usName} -- ${flag}`);
	});


	so.on('resLogout', data => {
		let { flag } = data;
		console.log(`resLogout: ${usName} -- ${flag}`);
	});

	so.on('disconnect', data => {
		console.log(`disconnect: ${usName}`);
	});

});

let watcher = soList['watcher'];
let watchedList: { userName: string, status: boolean }[] = [];
watcher.on('notiLogin', data => {
	let { userName } = data;
	watchedList.push({ userName, status: true });
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



async.series([
	(cb) => {
		watcher.emit('reqLogin', { userName: 'watcher', password: 'falcon' });
		cb();
	},
	(cb) => {
		setTimeout(cb, 1000);
	},
	(cb) => {
		userNameList.slice(1).forEach(n => {
			soList[n].emit('reqLogin', { userName: n, password: 'falcon' });
		});
		cb();
	},
	(cb) => {
		setTimeout(cb, 2000);
	},
	(cb) => {
		soList['b'].disconnect();
		cb();
	},
	(cb) => {
		soList['c'].emit('reqLogout');
		cb();
	}, (cb) => {
		setTimeout(cb, 200);
	},
], () => {
	console.log(watchedList);
});







