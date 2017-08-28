import * as io from "socket.io-client";
import * as _ from 'underscore';
import * as async from 'async';

console.log(new Date().toTimeString());

let watcher;
let watchedList: { userName: string, status: boolean }[] = [];
let watchedChatList: {
	from: string;
	message: string;
	timestamp: number;
}[] = [];
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

	watcher.on('notiChat', data => {
		let { from, timestamp, message } = data;
		watchedChatList.push(data);
	});
};



let login = (socket: SocketIOClient.Socket, userName: string) => {
	socket.emit('reqLogin', { userName, password: 'falcon' });
};

let logout = (socket: SocketIOClient.Socket) => {
	socket.emit('reqLogout');
};

let chat = (socket: SocketIOClient.Socket, message: string, to: string | 'world' | 'room') => {
	let data: any = {
		message
	};
	if ('world' == to) {
		// do nothing
		// default
	} else if ('room' == to) {

	} else {
		data.to = to;
	}
	socket.emit('reqChat', data);
}

let clear = (cb) => {
	watchedList = [];
	_.each(soList, so => {
		logout(so);
	});

	setTimeout(cb, 5000);
};

let testList = [];

// 测试登陆
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

// 测试聊天
// a,b,c登陆
// a在世界频道说了hello
// watcher听到了这句话,b,c也听到了hello这句话
// a对b私聊了一句world
// b听到,而c听不到
// 注意,a必然可以听到,因为a是发出者
testList.push((cb) => {
	let userNameList = ['a', 'b', 'c'];
	let chatList: { [userName: string]: { from: string, message: string, timestamp: number }[] } = {};
	async.series([
		cb => {
			userNameList.forEach(usName => {
				let so = createSocket();
				soList[usName] = so;

				so.on('notiChat', data => {
					let list = chatList[usName] = chatList[usName] || []
					list.push(data);
				});

				login(so, usName);
			});
			setTimeout(cb, 2000);
		},
		cb => {
			soList['a'].emit('reqChat', { message: 'hello', type: 0 });
			setTimeout(cb, 2000);
		},
		cb => {
			let bHearHello: boolean = chatList['b'].some(chat => chat.from == 'a' && chat.message == 'hello');
			let cHearHello: boolean = chatList['c'].some(chat => chat.from == 'a' && chat.message == 'hello');
			console.assert(bHearHello && cHearHello);
			cb();
		},
		cb => {
			soList['a'].emit('reqChat', { message: 'world', type: 2, to: 'b' });
			setTimeout(cb, 2000);
		},
		cb => {
			let aHearWorld: boolean = chatList['a'].some(chat => chat.from == 'a' && chat.message == 'world');
			let bHearWorld: boolean = chatList['b'].some(chat => chat.from == 'a' && chat.message == 'world');
			let cHearWorld: boolean = chatList['c'].some(chat => chat.from == 'a' && chat.message == 'world');
			console.assert(aHearWorld && bHearWorld && !cHearWorld);
			cb();
		},
		cb => {
			console.log(JSON.stringify(chatList, null, 4));
			chatList = null;
			cb();
		}
	], clear.bind(null, cb));

});

// 测试游戏(testGame),test是个石头剪刀布的游戏
// a,b,c登陆
// a匹配游戏
// 等待2秒，在等待的过程中，a收到它所在的某某房间还在等待
// b匹配游戏
// 系统将a，b匹配到一个房间，都收到匹配成功，并且开启一个新游戏的信息
// 系统通知a是第一个轮到的人[因为testGame是按照匹配顺序来的],消息发送给a,b
// a发出一个action,请求出"锤子"
// 系统通知b的turn
// b发出一个action,请求出"布"
// 系统进行判断,发出b胜利的信息,通知a和b
testList.push((cb) => {
	let userNameList = ['a', 'b', 'c'];
	let infoList: { [userName: string]: { event: string, data: any }[] } = {};
	let aList = infoList['a'] = [];
	let bList = infoList['b'] = [];
	async.series([
		cb => {
			userNameList.forEach(usName => {
				let so = createSocket();
				soList[usName] = so;

				so.on('resMatchGame', data => {
					infoList[usName].push({ event: 'resMatchGame', data });
				});

				so.on('notiMatchingGame', data => {
					infoList[usName].push({ event: 'notiMatchingGame', data: undefined });
				});

				so.on('notiMatchGame', data => {
					let { roomId, playerNameList } = data;
					infoList[usName].push({ event: 'notiMatchGame', data });
				});

				so.on('notiGameStart', data => {
					infoList[usName].push({ event: 'notiGameStart', data });
				});

				so.on('notiGameTurn', data => {
					infoList[usName].push({ event: 'notiGameTurn', data });
				});


				so.on('resGameAction', data => {
				});

				so.on('notiGameAction', data => {
					let list = infoList[usName];
					list.push(data);
				});

				login(so, usName);
			});
			setTimeout(cb, 2000);
		},
		cb => {
			soList['a'].emit('reqMatchGame', {
				name: 'TestGame'
			});
			setTimeout(cb, 8000);
		},
		cb => {
			let aHearResMatchGame = infoList['a'].some(n => n.event == 'resMatchGame');
			let aHearNotiMatchingGame = infoList['a'].some(n => n.event == 'notiMatchingGame');
			console.assert(aHearResMatchGame && aHearNotiMatchingGame, 'a hear resMatchGame && a hear notiMatchingGame  ');
			cb();
		},
		cb => {
			soList['b'].emit('reqMatchGame', {
				name: 'TestGame'
			});
			setTimeout(cb, 2000);
		},
		cb => {
			let bHearResMatchGame = infoList['b'].some(n => n.event == 'resMatchGame');
			console.assert(bHearResMatchGame, 'b hear resMatchGame ');
			cb();
		},
		cb => {
			let aHearNotiGameStart = infoList['a'].some(n => n.event == 'notiGameStart');
			let bHearNotiGameStart = infoList['b'].some(n => n.event == 'notiGameStart');

			let aHearNotiGameTurn = infoList['a'].some(n => n.event == 'notiGameTurn' && n.data.playerName == 'a');
			let bHearNotiGameTurn = infoList['b'].some(n => n.event == 'notiGameTurn' && n.data.playerName == 'a');

			console.assert(aHearNotiGameStart && bHearNotiGameStart);
			console.assert(aHearNotiGameTurn && bHearNotiGameTurn);

			setTimeout(cb, 2000);
		},
		cb => {
			console.log(JSON.stringify(infoList, null, 4));
			cb();
		},
		cb => {
			soList['a'].emit('reqGameAction', {
				actionName: 'gesture',
				actionData: 'cuizi'
			});
			setTimeout(cb, 2000);
		},
		cb => {

			let aHearNotiGameTurn = infoList['a'].some(n => n.event == 'notiGameTurn' && n.data.playerName == 'b');
			let bHearNotiGameTurn = infoList['b'].some(n => n.event == 'notiGameTurn' && n.data.playerName == 'b');
			console.assert(aHearNotiGameTurn && bHearNotiGameTurn);
			cb();
		},
		cb => {

			soList['b'].emit('reqGameAction', {
				actionName: 'gesture',
				actionData: 'bu'
			});
			setTimeout(cb, 2000);
		},
		cb => {
			let aHearNotiGameEnd = infoList['a'].some(n => n.event == 'notiGameEnd');
			let bHearNotiGameEnd = infoList['b'].some(n => n.event == 'notiGameEnd');
			console.assert(aHearNotiGameEnd && bHearNotiGameEnd);
			cb();
		}

	], clear.bind(null, cb));
});

createWatcher();
setTimeout(() => {
	let list = testList;
	list = [testList[testList.length - 1]];
	async.eachSeries(list, (te, cb) => te(cb), () => {
		console.log('test complete');
	});

}, 2000);



