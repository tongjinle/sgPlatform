import * as io from "socket.io-client";


let port = 1216;

let opts: SocketIOClient.ConnectOpts = {
	reconnection: false,
	// autoConnect:false,
	forceNew: true
};


let userNameList = ['watcher','a','b','c'];
let soList: { [userName: string]: SocketIOClient.Socket } = {};
userNameList.forEach(usName=>{
	let so: SocketIOClient.Socket = io("http://localhost:1216", opts);
	soList[usName] = so;

	so.on('resLogin', data => {
		let { flag } = data;
		console.log(`resLogin: ${usName} -- ${flag}`);
	});

	so.on('notiLogin', data => {
		let { userName } = data;
		console.log(`notiLogin: ${usName}`);
	});

	// so.on('disconnect', data => {
	// 	let { flag } = data;
	// 	console.log(`resLogin: ${usName} -- ${flag}`);
	// });


});

let watcher = soList['watcher'];
watcher.emit('reqLogin', { userName: 'watcher', password: 'falcon' });


