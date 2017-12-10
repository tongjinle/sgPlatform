import { Platform } from './platform';
import IMatch from './match/iMatch';
import IMatchInfo from './match/iMatchInfo';
import IAfterMatch from './match/IAfterMatch';

import { EGameName } from '../struct/enums';

import { Room } from './room/room';
import { User } from './user/user';
import { IGameInitData } from './game/game';
import { IHonestGameInitData } from './game/gallery/honest/honest';

let pl = Platform.getInstance();

// 以下由需要使用者自行编写
// matchMgr注入
injectTestGame();




pl.startServer();

// 设置要match的游戏
pl.matchGameNameList = [EGameName.TestGame];
pl.startMatchLoop();

// 测试游戏
function injectTestGame() {
    let gameName = EGameName.TestGame;
    {
        pl.matchMgr.addMatch(gameName, (list) => {
            if (list.length >= 2) {
                return list.slice(0, 2);
            }
        });

        pl.matchMgr.addAfterMatch(gameName, (list) => {
            let playerList: User[] = [];

            list.forEach(li => {
                playerList.push(pl.userMgr.findByUserName(li.id));
            });


            let ro = new Room(gameName, playerList, undefined);
            return ro;
        });
    }
}


// 真心话游戏
function injectHonest() {
    let gameName = EGameName.Honest;
    {
        let mgr = pl.matchMgr;
        let match: IMatch = (list) => {
            let rst: IMatchInfo[] = [];
            let boy: IMatchInfo;
            let girl: IMatchInfo;

            list.some(li => {
                let { sex } = li.data;
                if (sex == 0 && !boy) {
                    boy = li;
                }
                if (sex == 1 && !girl) {
                    girl = li;
                }
                if (boy && girl) {
                    return true;
                }
            });

            if (boy && girl) {
                return [boy, girl,];
            }
        };
        mgr.addMatch(gameName, match);
    }

    {
        let mgr = pl.matchMgr;
        let userMgr = pl.userMgr;
        let afterMatch: IAfterMatch = (list) => {
            if(!list || list.length==0){
                console.log('no list',list);
                return;
            }
            let userList: User[] = [];
            let initData: IHonestGameInitData = {
                boyName: undefined,
                girlName: undefined,
            };

            list.forEach(li => {
                {
                    let us = userMgr.findByUserName(li.id);
                    userList.push(us);
                    console.log(us.userName,li.id);
                }

                {
                    let { sex } = li.data;
                    if (sex == 0) {
                        initData.boyName = li.id;
                    } else if (sex == 1) {
                        initData.girlName = li.id;
                    }
                }
            });
            let ro = new Room(gameName, userList, initData);
            return ro;
        };
        mgr.addAfterMatch(gameName, afterMatch);
    }
}

