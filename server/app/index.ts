import { Platform } from './platform';
import IMatch from './match/iMatch';
import IMatchInfo from './match/iMatchInfo';
import IAfterMatch from './match/IAfterMatch';

import { EGameName } from '../struct/enums';

import { Room } from './room/room';
import { User } from './user/user';
import { IHonestGameInitData } from './game/gallery/honest/honest';

let pl = Platform.getInstance();

// 以下由需要使用者自行编写
// matchMgr注入
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
        let playerList: User[] = [];
        let initData: IHonestGameInitData = {
            boyName: undefined,
            girlName: undefined,
        };

        list.forEach(li => {
            {
                let us = userMgr.findByUserName(li.id);
                playerList.push(us);
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
        list.map(li => {
            let us = userMgr.findByUserName(li.id);
            return us;
        });
        let ro = new Room(gameName, playerList, initData);
    };
    mgr.addAfterMatch(gameName, afterMatch);
}


pl.startServer();