import { EGameName } from '../../struct/enums';
import IMatch from './iMatch';
import IMatchInfo from './iMatchInfo';
import EMatch from './eMatch';
import IAfterMatch from './IAfterMatch';
import EMatchEvent from './eMatchEvent';
import { EventEmitter } from 'events';
import loger from '../loger';
import { Room } from '../room/room';


// 匹配管理类
export default class MatchMgr extends EventEmitter {
    private dict: { [gameName: number]: IMatchInfo[] };
    private matchDict: { [gameName: number]: IMatch };
    private afterMatchDict: { [gameName: number]: IAfterMatch };

    constructor() {
        super();

        this.dict = {};
        this.matchDict = {};
        this.afterMatchDict = {};
    }

    // 增加一个等待match的人
    add(gameName: EGameName, info: IMatchInfo): EMatch {
        if (this.matchDict[gameName] === undefined) {
            return EMatch.gameNotExist;
        }

        let list = this.dict[gameName] = this.dict[gameName] || [];
        if (list.every(n => n.id != info.id)) {
            list.push(info);

            this.emit(EMatchEvent.afterAddMatchInfo, info);

            return EMatch.success;
        }
        return EMatch.duplicateMatch;
    }

    remove(gameName: EGameName, ...args: IMatchInfo[]): void {
        if (!this.dict[gameName]) { return; }
        this.dict[gameName] = this.dict[gameName].filter(info => !args.some(n => n.id == info.id));
    }



    // 增加一个匹配算法
    addMatch(gameName: EGameName, match: IMatch) {
        this.matchDict[gameName] = match;
    }

    // 增加一个匹配成功之后的方法
    addAfterMatch(gameName: EGameName, afterMatch: IAfterMatch): void {
        this.afterMatchDict[gameName] = afterMatch;
    }

    match(gameName: EGameName): IMatchInfo[] {
        let list = this.dict[gameName];
        if (!list) { return undefined; }

        let matchHandle: IMatch = this.matchDict[gameName];
        if (!matchHandle) { return undefined; }

        return matchHandle(list);

    }

    afterMatch(gameName: EGameName, matchList: IMatchInfo[]): Room {
        let handler = this.afterMatchDict[gameName];
        if (handler) {
            let ro = handler(matchList);
            return ro;
        }
    }

}