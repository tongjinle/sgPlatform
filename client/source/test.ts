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



async.series([
	cb => {
		watcher.emit('reqLogin', { userName: 'watcher', password: 'falcon' });
		setTimeout(cb, 100);
	},
	cb => {
		userNameList.slice(1).forEach(n => {
			soList[n].emit('reqLogin', { userName: n, password: 'falcon' });
		});
		setTimeout(cb, 200);
	},
	cb => {
		soList['b'].disconnect();
		soList['c'].emit('reqLogout');
		setTimeout(cb, 200);
	},
	cb => {
		console.log(JSON.stringify(watchedList,null,4));
		cb();
	},
	cb => {
		let usName = 'b';
		soList[usName] = io("http://localhost:1216", opts);
		soList[usName].emit('reqLogin', { userName: usName, password: 'falcon' });
		setTimeout(cb, 2000);

	},
	cb => {
		console.log(JSON.stringify(watchedList,null,4));
		cb();
	},
	cb=>{
		watcher.emit('reqOnlineUserList');
		cb();
	}
]);







