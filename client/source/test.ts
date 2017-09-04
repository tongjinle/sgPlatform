import * as io from "socket.io-client";
import * as _ from 'underscore';
import * as async from 'async';


enum EGameStatus {
    Prepare,
    Play,
    Pause,
    End
};

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
};

let match = (socket: SocketIOClient.Socket, name: string) => {
    socket.emit('reqMatchGame', { name });
};

let clear = (cb) => {
    // _.each(soList, (v, k) => {
    // 	delete soList[k];
    // });
    watchedList = [];
    _.each(soList, (so, usName) => {
        console.log(`${usName} logout...`);
        logout(so);
    });
    console.log('clear complete');
    setTimeout(cb, 5000);
};

let filterEvent = (infoList: { [userName: string]: { event: string, data: any }[] }, userName: string, event: string) => {
    return infoList[userName].filter(n => n.event == event);
};

let testList = [];

// [1]测试登陆
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

// [2]测试聊天
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

// [3]测试游戏(testGame),test是个石头剪刀布的游戏
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

                so.on('notiMatchingGame', data => {
                    infoList[usName].push({ event: 'notiMatchingGame', data: undefined });
                });

                so.on('notiMatchGame', data => {
                    let { playerNameList } = data;
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
            let aHearNotiMatchingGame = infoList['a'].some(n => n.event == 'notiMatchingGame');
            console.assert(aHearResMatchGame && aHearNotiMatchingGame, 'a hear resMatchGame && a hear notiMatchingGame  ');
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
            let aHearNotiGameEnd = infoList['a'].some(n => n.event == 'notiGameEnd' && n.data.data.winner == 'b');
            let bHearNotiGameEnd = infoList['b'].some(n => n.event == 'notiGameEnd' && n.data.data.winner == 'b');
            console.assert(aHearNotiGameEnd && bHearNotiGameEnd, 'a & b hear notiGameEnd');
            cb();
        },
        cb => {
            console.log(JSON.stringify(infoList, null, 4));
            cb();
        }

    ], clear.bind(null, cb));
});

// [4]游戏中登出,等于投降
// a,b登陆
// a,b匹配游戏,a,b开始游戏
// a登出
// b听到游戏被pause
// b听到游戏结束,b是胜利者
testList.push(cb => {
    let userNameList = ['a', 'b'];
    let infoList: { [userName: string]: { event: string, data: any }[] } = {};
    let aList: { event: string, data: any }[] = infoList['a'] = [];
    let bList: { event: string, data: any }[] = infoList['b'] = [];
    let roomId: string;
    async.series([
        cb => {
            userNameList.forEach(usName => {
                let so = soList[usName] = createSocket();
                login(so, usName);
            });
            setTimeout(cb, 2000);

            soList['b'].on('notiGameStatusChanged', data => {
                bList.push({ event: 'notiGameStatusChanged', data })
            });


            soList['b'].on('notiGameEnd', data => {
                bList.push({ event: 'notiGameEnd', data })
            });
        },
        cb => {
            soList['a'].emit('reqMatchGame', {
                name: 'TestGame'
            });
            soList['b'].emit('reqMatchGame', {
                name: 'TestGame'
            });
            setTimeout(cb, 10000);
        },
        cb => {
            logout(soList['a']);
            setTimeout(cb, 2000);
        },
        cb => {
            let bHearGameEnd = infoList['b'].some(n => n.event == 'notiGameEnd' && n.data.data.winner == 'b');
            console.assert(bHearGameEnd, 'b hear gameEnd, b is the winner');
            console.log(JSON.stringify(bList, null, 4));
            cb();
        }
    ], clear.bind(null, cb));
});


// [5]测试重连--正常
// a,b登陆
// a,b匹配游戏,a,b开始游戏
// a断线,但是没有超时,超时时间为10秒
// game状态应该为pause
// a重连,game状态改回play
// a发出action,请求出"锤子"
// b发出action,请求出"剪刀"
testList.push((cb) => {
    let userNameList = ['a', 'b'];
    let infoList: { [userName: string]: { event: string, data: any }[] } = {};
    let aList: { event: string, data: any }[] = infoList['a'] = [];
    let bList: { event: string, data: any }[] = infoList['b'] = [];
    let roomId: string;
    async.series([
        cb => {
            userNameList.forEach(usName => {
                let so = soList[usName] = createSocket();
                login(so, usName);

                so.on('notiGameStatusChanged', (data) => {
                    infoList[usName].push({ event: 'notiGameStatusChanged', data });
                });

                so.on('notiMatchGame', data => {
                    roomId = data.roomId;
                });
            });


            setTimeout(cb, 2000);
        },
        cb => {
            match(soList['a'], 'TestGame');
            match(soList['b'], 'TestGame');
            setTimeout(cb, 10000);
        },
        cb => {
            soList['a'].disconnect();
            setTimeout(cb, 2000);
        },
        cb => {
            let bHearGameStatusChanged = bList.some(n => n.event == 'notiGameStatusChanged' && EGameStatus[n.data.status] == 'Pause');
            console.assert(bHearGameStatusChanged, 'b hear gameStatus changed -- Pause');
            cb();
        },
        cb => {
            soList['a'] = createSocket();
            login(soList['a'], 'a');
            setTimeout(cb, 2000);
        },
        cb => {
            let list: { event: string, data: any }[];
            let getLastStatus = () => {
                return EGameStatus[list[list.length - 1].data.status];
            };
            list = filterEvent(infoList, 'b', 'notiGameStatusChanged');
            let bHearGameStatusChanged = getLastStatus() == 'Play';


            console.assert(bHearGameStatusChanged, 'b hear gameStatus changed -- PLAY');
            cb();
        },
        cb => {
            console.log(JSON.stringify(infoList, null, 4));
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
            soList['b'].emit('reqGameAction', {
                roomId,
                actionName: 'gesture',
                actionData: { gestureName: 'jiandao' }
            });
            setTimeout(cb, 2000);
        }
    ], clear.bind(null, cb));
});



// [6]测试重连--超时
// a,b登陆
// a,b匹配游戏,a,b开始游戏
// a断线,并且超时,超时时间为10秒
// b获得胜利,听到gameEnd的消息
// a重新登陆后,也听到了这个消息
testList.push(cb => {
    let userNameList = ['a', 'b'];
    let infoList: { [userName: string]: { event: string, data: any }[] } = {};
    let aList: { event: string, data: any }[] = infoList['a'] = [];
    let bList: { event: string, data: any }[] = infoList['b'] = [];
    let roomId: string;
    async.series([
        cb => {
            userNameList.forEach(usName => {
                let so = soList[usName] = createSocket();
                login(so, usName);

                so.on('notiMatchGame', data => {
                    roomId = data.roomId;
                });
            });

            soList['b'].on('notiGameEnd', data => {
                bList.push({ event: 'notiGameEnd', data });
            });


            setTimeout(cb, 2000);
        },
        cb => {
            userNameList.forEach(usName => {
                soList[usName].emit('reqMatchGame', { name: 'TestGame' });
            });
            setTimeout(cb, 2000);
        },
        cb => {
            soList['a'].disconnect();
            setTimeout(cb, 15000);
        },
        cb => {
            let bHearGameEnd = bList.some(n => n.event == 'notiGameEnd' && n.data.data.winner == 'b');
            console.assert(bHearGameEnd, 'b hear gameEnd, b is the winner');
            cb();
        },
        cb => {
            let so = soList['a'] = createSocket();
            login(soList['a'], 'a');
            so.on('notiGameEnd', data => {
                aList.push({ event: 'notiGameEnd', data });
            });

            setTimeout(cb, 2000);
        },
        cb => {
            let aHearGameEnd = aList.some(n => n.event == 'notiGameEnd' && n.data.data.winner == 'b');
            console.assert(aHearGameEnd, 'a hear gameEnd, b is the winner');
            cb();
        }

    ], clear.bind(null, cb));
});


// [7]测试重连--超过最大重连次数
// a,b登陆
// a,b匹配游戏,a,b开始游戏
// a断线,重连,反复3次,在第四次的时候,系统判断a多次断线而游戏失败
// b获得胜利,听到gameEnd的消息
testList.push(cb => {
    let userNameList = ['a', 'b'];
    let infoList: { [userName: string]: { event: string, data: any }[] } = {};
    let aList: { event: string, data: any }[] = infoList['a'] = [];
    let bList: { event: string, data: any }[] = infoList['b'] = [];
    let roomId: string;
    async.series([
        cb => {
            userNameList.forEach(usName => {
                let so = soList[usName] = createSocket();
                login(so, usName);

                so.on('notiMatchGame', data => {
                    roomId = data.roomId;
                });
            });

            soList['b'].on('notiGameStatusChanged', data => {
                bList.push({ event: 'notiGameStatusChanged', data });
            });

            soList['b'].on('notiGameEnd', data => {
                bList.push({ event: 'notiGameEnd', data });
            });


            setTimeout(cb, 2000);
        },
        cb => {
            userNameList.forEach(usName => {
                soList[usName].emit('reqMatchGame', { name: 'TestGame' });
            });
            setTimeout(cb, 2000);
        },
        cb => {
            let count = 2;
            let arr = [];
            while (count--) {
                arr.push((cb) => {
                    let arr = [
                        cb => {
                            soList['a'].disconnect();
                            setTimeout(cb, 1000);
                        },
                        cb => {
                            login(soList['a'], 'a');
                            setTimeout(cb, 1000);
                        }
                    ];
                    async.series(arr, cb);
                });
            };
            async.series(arr, cb => {
                setTimeout(cb, 2000);
            });
        },
        cb => {
            let bNotHearGameEnd = !bList.some(n => n.event == 'notiGameEnd');
            console.assert(bNotHearGameEnd, 'b NOT hear gameEnd');
        },
        cb => {
            soList['a'].disconnect();
            setTimeout(cb, 2000);
        },
        cb => {
            let bHearGameEnd = bList.some(n => n.event == 'notiGameEnd' && n.data.data.winner == 'b');
            console.assert(bHearGameEnd, 'b hear gameEnd, b is the winner');
            cb();
        },
        cb => {
            let so = soList['a'] = createSocket();
            so.on('notiGameEnd', data => {
                aList.push({ event: 'notiGameEnd', data });
            });

            login(soList['a'], 'a');
            setTimeout(cb, 2000);
        },
        cb => {
            let aHearGameEnd = aList.some(n => n.event == 'notiGameEnd' && n.data.data.winner == 'b');
            console.assert(aHearGameEnd, 'a hear gameEnd, b is the winner');
            cb();
        }

    ], clear.bind(null, cb));
});


// [8]测试观看
// a,b,c登陆
// a,b进行游戏,c进入房间,进行了观看
// c除了不能发送gameAction,可以进行所有的操作
testList.push(cb => {
    let userNameList = ['a', 'b', 'c'];
    let infoList: { [userName: string]: { event: string, data: any }[] } = {};
    let aList: { event: string, data: any }[] = infoList['a'] = [];
    let bList: { event: string, data: any }[] = infoList['b'] = [];
    let roomId: string;
    async.series(
        [
            cb => {
                userNameList.forEach(usName => {
                    let so = soList[usName] = createSocket();
                    login(so, usName);

                    so.on('notiMatchGame', data => {
                        roomId = data.roomId;
                    });
                });

                soList['c'].on('notiGameUpdate', data => {
                    bList.push({ event: 'notiGameUpdate', data });
                });

                soList['c'].on('notiGameLastUpdate', data => {
                    bList.push({ event: 'notiGameLastUpdate', data });
                });


                soList['c'].on('resWatchGame', data => {
                    bList.push({ event: 'resWatchGame', data });
                });




                setTimeout(cb, 2000);
            },
            cb => {
                userNameList.forEach(usName => {
                    login(soList[usName], usName);
                });
                setTimeout(cb, 2000);
            },
            cb => {
                userNameList.forEach(usName => {
                    soList[usName].emit('reqMatchGame', { name: 'TestGame' });
                });
                setTimeout(cb, 2000);
            },
            cb => {
                soList['c'].emit('reqWatchGame', { roomId });
                setTimeout(cb, 2000);
            },
            cb => {
                let cHearResWatchGame = infoList['c'].some(n => n.event == 'resWatchGame');
                let cHearNotiGameLastUpdate = infoList['c'].some(n => n.event == 'notiGameLastUpdate');
                console.assert(cHearResWatchGame, 'c hear resWatchGame');
                console.assert(cHearNotiGameLastUpdate, 'c hear notiGameLastUpdate');
                cb();
            },
            cb => {
                logout(soList['a']);
                setTimeout(cb, 2000);
            }
        ],

        clear.bind(null, cb)
    );

});


createWatcher();
setTimeout(() => {
    let list = testList;
    
    let index = 4;
    list = list.slice(0, index + 1);
    // list = [testList[index]];

    // list = [testList[2]];

    let n = 0;
    async.eachSeries(list,
        (te, cb) => {
            n++;
            console.log('question index: ' + n);

            te(cb);
        },
        () => {
            console.log('test complete');
        });

}, 2000);



