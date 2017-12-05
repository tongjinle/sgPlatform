import { EGameName } from '../struct/enums';

export interface IMatchInfo {
    id: stirng,
    gameName: EGameName,
    data: any,
};

export interface IMatch {
    (list: IMatchInfo[]): IMatchInfo[],
}

export class MatchMgr {
    private matchDict: { [gameName: number]: IMatch };
    private dict: { [gameName: number]: IMatchInfo[] };
    private loopHandle: number;
    private loopInterval: number = 1000;

    // 成功
    public afterMatchSucc = (matched: IMatchInfo[]) => void;

    constructor() {
        this.dict = {};
        this.matchDict = {};
    }

    // 增加一个等待match的人
    add(gameName: EGameName, info: IMatchInfo): boolean {
        let list = this.dict[gameName] = this.dict[gameName] || [];
        if (list.every(n => n.id != info.id)) {
            list.push(info);
            return true;
        }
        return false;
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
                list = list.filter(ma => !matched.some(maed.id == ma.id));
                return matched;
            }
            return undefined;
        }
    }
}