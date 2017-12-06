import { EGameName } from '../../struct/enums';
import IMatch from './iMatch';
import IMatchInfo from './iMatchInfo';
import EMatch from './eMatch';

// 匹配管理类
export default class MatchMgr {
    private matchDict: { [gameName: number]: IMatch };
    private dict: { [gameName: number]: IMatchInfo[] };
    private loopHandle: NodeJS.Timer;
    private loopInterval: number;

    // 成功
    public afterMatchSucc: (matched: IMatchInfo[]) => void;

    constructor(loopInterval: number) {
        this.dict = {};
        this.matchDict = {};
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
                let matched = this.loop();
                if (matched && this.afterMatchSucc) {
                    this.afterMatchSucc(matched);
                }
            }, this.loopInterval);
        }

    }

    stopLoop() {
        if (this.loopHandle) {
            clearInterval(this.loopHandle);
        }
    }

    private loop(): IMatchInfo[] {
        for (let gameName in this.dict) {
            let list = this.dict[gameName];
            let matchHandle: IMatch = this.matchDict[gameName];
            if (!matchHandle) {
                return undefined;
            }
            let matched = matchHandle(list);

            if (matched) {
                // filter matched
                list = list.filter(ma => !matched.some(maed => maed.id == ma.id));
                return matched;
            }
            return undefined;
        }
    }
}