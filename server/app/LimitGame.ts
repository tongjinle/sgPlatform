import { Game } from './game';
import { ILimitGame } from './iLimitGame';
import * as _ from 'underscore';
import loger from './loger';

export class LimitGame extends Game implements ILimitGame {
    timeLimit: number;
    countLimit: number;

    // 让具体的游戏去实现
    afterTimeout(): void { }


    afterPlayerDisconnect(playerName: string): void {
        console.log(123123);
        super.afterPlayerDisconnect(playerName);

        let pler = _.find(this.playerList, pler => pler.userName == playerName);
        if (pler) {
            loger.debug(`${pler.userName}::${pler.offlineCount}::${this.countLimit}`);
            if (pler.offlineCount >= this.countLimit) {
                this.afterPlayerLogout(playerName);
            }
        }
    };
}