import { EGameName } from '../../struct/enums';
import IMatch from './iMatch';
import IMatchInfo from './iMatchInfo';
import EMatch from './eMatch';
import IAfterMatch from './IAfterMatch';

// 匹配管理类
export default class MatchMgr {
    private dict: { [gameName: number]: IMatchInfo[] };
    private matchDict: { [gameName: number]: IMatch };
    private afterMatchDict: { [gameName: number]: IAfterMatch };

    private loopHandle: NodeJS.Timer;
    private loopInterval: number;

    // 成功

    constructor(loopInterval: number) {
        this.dict = {};
        this.matchDict = {};
        this.afterMatchDict = {};

        this.loopInterval = loopInterval;
    }

    // 增加一个等待match的人
    add(gameName: EGameName, info: IMatchInfo): EMatch {
        if (this.dict[gameName] === undefined) {
            return EMatch.gameNotExist;
        }

        let list = this.dict[gameName] = this.dict[gameName] || [];
        if (list.every(n => n.id != info.id)) {
            list.push(info);
            return EMatch.success;
        }
        return EMatch.duplicateMatch;
    }

    startLoop() {
        if (!this.loopHandle) {
            this.loopHandle = setInterval(() => {
                let matchRst = this.loop();
                if (matchRst) {
                    let afterMatch = this.afterMatchDict[matchRst.gameName];
                    if (afterMatch) {
                        afterMatch(matchRst.matchList);
                    }
                }
            }, this.loopInterval);
        }

    }

    stopLoop() {
        if (this.loopHandle) {
            clearInterval(this.loopHandle);
        }
    }

    // 增加一个匹配算法
    addMatch(gameName: EGameName, match: IMatch) {
        this.matchDict[gameName] = match;
    }

    // 增加一个匹配成功之后的方法
    addAfterMatch(gameName: EGameName, afterMatch: IAfterMatch) {
        this.afterMatchDict[gameName] = afterMatch;
    }

    private loop(): { gameName: EGameName, matchList: IMatchInfo[] } {
        for (let key in this.dict) {
            let gameName: EGameName = parseInt(key);
            let list = this.dict[gameName];
            let matchHandle: IMatch = this.matchDict[gameName];
            if (!matchHandle) {
                return undefined;
            }
            let matchList = matchHandle(list);

            if (matchList) {
                // filter matchList
                list = list.filter(ma => !matchList.some(maed => maed.id == ma.id));
                return { gameName, matchList, };
            }
            return undefined;
        }
    }
}