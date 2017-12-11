import * as Http from 'http';
import { EPlatformStatus, EGameName, EUserStatus, } from '../struct/enums';
import * as Protocol from '../struct/protocol';
import * as SocketIO from 'socket.io';
import loger from './loger';
import * as _ from 'underscore';

import IMatchInfo from './match/iMatchInfo';
import EMatchEvent from './match/eMatchEvent';
import MatchMgr from './match/matchMgr';

import UserMgr from './user/userMgr';
import RoomMgr from './room/roomMgr';

import config from './config';

import Loop from './loop';


export class Platform {
    status: EPlatformStatus;
    io: SocketIO.Server;

    matchMgr: MatchMgr;
    userMgr: UserMgr;
    roomMgr: RoomMgr;

    matchGameNameList: EGameName[];
    private matchLoopTimer: NodeJS.Timer;
    private matchLoopInterval: number;
    private isMatching: boolean;

    matchLoop: Loop;
    clearDiscLoop: Loop;

    private constructor() {
        this.userMgr = new UserMgr();

        this.roomMgr = new RoomMgr();

        this.matchMgr = new MatchMgr();

        // match loop
        this.matchLoop = new Loop();
        this.matchLoop.handler = () => {
            this.matchGameNameList.forEach(gameName => {
                let matchInfoList = this.matchMgr.match(gameName);
                if (matchInfoList) {
                    this.matchMgr.remove(gameName, ...matchInfoList);

                    let ro = this.matchMgr.afterMatch(gameName, matchInfoList);
                    if (ro) {
                        this.roomMgr.add(ro);

                        let roomId = ro.id;
                        let userNameList = ro.userList.map(us => us.userName);
                        let notiData: Protocol.INotifyMatchGame = { roomId, userNameList, };
                        ro.notifyAll('notiMatchGame', notiData);

                        ro.start();
                    }
                }
            });
        };
        this.matchLoop.interval = config.platform.matchInterval;

        // clear disconnect user loop
        this.clearDiscLoop = new Loop();
        this.clearDiscLoop.handler = () => {
            let duration: number = config.platform.reconnectDuration;
            let now = Date.now();
            this.userMgr.userList.forEach(us => {
                if (EUserStatus.Online == us.status) { return; }
                if (now - us.offLineTs > duration) {
                    this.userMgr.logout(us.userName);
                }
            });
        };
        this.clearDiscLoop.interval = config.platform.clearInterval;


    }

    startServer() {
        const { port } = config.platform;
        let ret: Platform;
        let serv = Http.createServer();
        this.io = SocketIO(serv);


        serv.listen(port, () => {
            let addrInfo = serv.address();
            loger.info(`server address : ${addrInfo.address}`);
            loger.info(`server port : ${addrInfo.port}`);
            loger.info(`start server at ${new Date().toTimeString()}`);
        });



        this.listen();
        this.status = EPlatformStatus.Open;
    }

    // 开始清理断线玩家
    startClearDisconnectUser() {

    }




    private listen(): void {
        let io = this.io;
        io.on('connect', so => {
            this.userMgr.add(so, this);
        });

        this.matchMgr.on(EMatchEvent.afterAddMatchInfo, (matchInfo: IMatchInfo) => {
            // let us = this.userMgr.findByUserName(matchInfo.id);
            // if(us){
            //     us.socket.emit('resMatchingGame');
            //     loger.debug(us.socket.id);
            //     loger.debug(`resMatchingGame::${us.userName}`);
            // }
        });
    }


    // 广播到platform房间
    broadcast(eventName: string, ...data: any[]): void {
        this.io.to('platform').emit(eventName, ...data);
    }

    // private loopHoldList(): void {
    // 	setInterval(() => {
    // 		let ts = new Date().getTime();
    // 		for (var i = 0; i < this.holdList.length; i++) {
    // 			let ho = this.holdList[i];
    // 			if (ts - ho.ts >= this.holdDuration) {
    // 				this.holdList.splice(i, 1);
    // 				loger.info(`remove hold::${ho.userName}`);
    // 			}
    // 		}
    // 	}, 1000);
    // }


    // private loopMatchGame(): void {
    // setInterval(() => {
    // 	let ts = Date.now();
    // 	_.each(this.matchingList, (list, name) => {
    // 		while (list.length >= 2) {
    // 			let matchedList = list
    // 				.splice(0, 2)
    // 				.map(usName => _.find(this.userList, us => us.userName == usName));

    // 			loger.info(`notiMatchGame::${matchedList.map(us => us.userName).join('&')}`);

    // 			let initData:igam
    // 			let ro = new Room(EGameName[name], matchedList,{});
    // 			{
    // 				let notiData: Protocol.INotifyMatchGame = {
    // 					roomId: ro.id,
    // 					playerNameList: ro.playerList.map(pler => pler.userName)
    // 				};
    // 				this.io.to(ro.id).emit('notiMatchGame', notiData);
    // 			}
    // 			this.roomList.push(ro);
    // 			ro.start();
    // 		}
    // 		// notify user MATCHING
    // 		list.forEach(usName => {
    // 			let us = _.find(this.userList, us => us.userName == usName);
    // 			if (us) {
    // 				us.socket.emit('notiMatchingGame');
    // 				loger.info(`notiMatchingGame::${us.userName}`);
    // 			}
    // 		});
    // 	});
    // 	// console.log(JSON.stringify(this.matchingList, null, 4));
    // }, 5000);
    // }

    // clear(user: User): void {
    // 	// 将掉线的user从matchingList中移除
    // 	{
    // 		let map = this.matchingList;
    // 		_.each(map, (list, gameName) => {
    // 			list = list.filter(usName => usName != user.userName);
    // 		});
    // 	}
    // 	// 如果有人退出,则要把游戏自动结束,认为这样是一种投降
    // 	// todo
    // }

    private static ins: Platform;
    static getInstance(): Platform {
        if (!Platform.ins) {
            Platform.ins = new Platform();
        }

        return Platform.ins;

    };

};