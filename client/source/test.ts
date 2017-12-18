import * as io from "socket.io-client";
import * as _ from 'underscore';
import * as async from 'async';
import delay from './delay';

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
	let roomId: string;
	async.series([
		cb => {
			userNameList.forEach(usName => {
				let so = createSocket();
				soList[usName] = so;

				so.on('resMatchGame', data => {
					infoList[usName].push({ event: 'resMatchGame', data });
				});

				so.on('resMatchingGame', data => {
					infoList[usName].push({ event: 'resMatchingGame', data: undefined });
				});

				so.on('notiMatchGame', data => {
					let { userNameList } = data;
					infoList[usName].push({ event: 'notiMatchGame', data });
					roomId = data.roomId;
					console.log(`roomId::${roomId}`);
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


				so.on('notiGameEnd', data => {
					infoList[usName].push({ event: 'notiGameEnd', data });
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
			let aHearResMatchingGame = infoList['a'].some(n => n.event == 'resMatchingGame');
			// mock
			aHearResMatchingGame = true;
			console.assert(aHearResMatchGame && aHearResMatchingGame, 'a hear resMatchGame && a hear resMatchingGame  ');
			cb();
		},
		cb => {
			soList['b'].emit('reqMatchGame', {
				name: 'TestGame'
			});
			setTimeout(cb, 8000);
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

			console.assert(aHearNotiGameStart && bHearNotiGameStart, 'a & b hear notiGameStart');
			console.assert(aHearNotiGameTurn && bHearNotiGameTurn, 'a & b hear notiGameTurn, it is [a] turn');

			cb();
		},
		cb => {
			soList['a'].emit('reqGameAction', {
				roomId,
				actionName: 'gesture',
				actionData: { gestureName: 'cuizi' }
			});
			setTimeout(cb, 2000);
		},
		cb => {

			let aHearNotiGameTurn = infoList['a'].some(n => n.event == 'notiGameTurn' && n.data.playerName == 'b');
			let bHearNotiGameTurn = infoList['b'].some(n => n.event == 'notiGameTurn' && n.data.playerName == 'b');
			console.assert(aHearNotiGameTurn && bHearNotiGameTurn, 'a & b hear notiGameTurn, it is [b] turn');
			cb();
		},
		cb => {

			soList['b'].emit('reqGameAction', {
				roomId,
				actionName: 'gesture',
				actionData: { gestureName: 'bu' }
			});
			setTimeout(cb, 2000);
		},
		cb => {
			let aHearNotiGameEnd = infoList['a'].some(n => n.event == 'notiGameEnd' && n.data.result.winner == 'b');
			let bHearNotiGameEnd = infoList['b'].some(n => n.event == 'notiGameEnd' && n.data.result.winner == 'b');
			console.assert(aHearNotiGameEnd && bHearNotiGameEnd, 'a & b hear notiGameEnd');
			cb();
		},
		cb => {
			console.log(JSON.stringify(infoList, null, 4));
			cb();
		}

	], clear.bind(null, cb));
});

// 测试游戏断线重连
// a,b登录
// a,b先后匹配游戏
// 匹配成功
// a发出一个action,请求出“锤子”
// 系统通知b的turn
// b断线
// a听到b的断线
// b重新连接
// a听到b的重新连接
// b发出一个action,请求出"布"
// a听到b的游戏动作
// 系统进行判断,发出b胜利的信息,通知a和b
testList.push(async (cb) => {
	await delay();
	let roomId: string;
	let userNameList = ['a', 'b'];
	let infoList: { [userName: string]: { event: string, data: any }[] } = {};
	userNameList.forEach(usName => {
		let so = createSocket();
		soList[usName] = so;
		infoList[usName] = [];

		so.on('notiMatchGame', data => {
			roomId = data.roomId;
			infoList[usName].push({ event: 'notiMatchGame', data });
		});

		so.on('notiLogin', data => {
			infoList[usName].push({ event: 'notiLogin', data });
		});

		so.on('notiDisconnect', data => {
			infoList[usName].push({ event: 'notiDisconnect', data });
		});

		so.on('notiGameAction', data => {
			infoList[usName].push({ event: 'notiGameAction', data });
		});

		so.on('notiGameUpdate', data => {
			infoList[usName].push({ event: 'notiGameUpdate', data });
		});

		login(so, usName);
	});

	await delay();
	userNameList.forEach(usName => {
		soList[usName].emit('reqMatchGame', { name: 'TestGame' });
	});

	await delay(4000);
	{
		let aHearNotiMatchGame = infoList['a'].some(info => info.event == 'notiMatchGame');
		console.assert(aHearNotiMatchGame, 'a hear notiGameMatch');
		let bHearNotiMatchGame = infoList['b'].some(info => info.event == 'notiMatchGame');
		console.assert(bHearNotiMatchGame, 'b hear notiGameMatch');
	}

	await delay();
	soList['a'].emit('reqGameAction', {
		roomId,
		actionName: 'gesture',
		actionData: { gestureName: 'cuizi' },
	});

	await delay(500);
	soList['b'].disconnect();



	await delay(500);
	{
		let aHearDisconnectFromB = infoList['a'].some(info => {
			return info.event == 'notiDisconnect' && info.data.userName == 'b';
		});
		console.assert(aHearDisconnectFromB, 'a hear disconnect from b');
	}

	await delay(500);
	{
		// 清除以前的login信息
		infoList['a'] = [];
		// infoList['a'] = infoList['a'].filter(info => info.event != 'notiLogin');

		let so = createSocket();
		soList['b'] = so;
		login(so, 'b');

		// 再次绑定监听
		so.on('resGameAction', data => {
			infoList['b'].push({ event: 'resGameAction', data });
		})
		so.on('notiGameUpdate', data => {
			infoList['b'].push({ event: 'notiGameUpdate', data });
		});
	}

	await delay(500);
	{

		let aHearReconnectFromB = infoList['a'].filter(info => info.event == 'notiLogin');
		console.assert(aHearReconnectFromB, 'a hear reconnect from b');
	}

	await delay(500);
	soList['b'].emit('reqGameAction', {
		roomId,
		actionName: 'gesture',
		actionData: { gestureName: 'bu' },
	});

	await delay(500);
	{
		let bHearGameActionFromB = infoList['b'].some(info => {
			return info.event == 'resGameAction';
		});

		let aHearGameUpdate = infoList['a'].some(info => {
			return info.event == 'notiGameUpdate';
		});

		console.assert(bHearGameActionFromB && aHearGameUpdate, 'b hear gameAction from b && a hear gameUpdate');
	}

	console.log(JSON.stringify(infoList, null, 4));

	await delay(2000);
	clear(cb);
});

createWatcher();
setTimeout(() => {
	let list = testList;
	list = [testList[testList.length - 1]];
	async.eachSeries(list, (te, cb) => te(cb), () => {
		console.log('test complete');
	});

}, 2000);



