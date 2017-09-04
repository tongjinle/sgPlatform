import { EGameStatus } from '../../struct/enums';
import { Game, GameAction, IGameResult } from '../game';
import {LimitGame} from '../LimitGame';
import { Player } from '../user/player';
import * as _ from 'underscore';
import loger from '../loger';
import * as Protocol from '../../struct/protocol';
import IGameTimeLimit from '../iGameTimeLimit';
import {judge} from '../afterTimeout/simple';

// gesture data struct
export interface ITestGameGestureAction  {
    gestureName: string;
};

// gameEnd data struct
export interface ITestGameResult extends IGameResult{
    winner: string;
};

export class TestGame extends LimitGame {
    private gestureMap: { playerName: string, gestureName: string }[];
    private winner: Player;
    private static gestureList = ['bu', 'jiandao', 'cuizi'];

   

    constructor() {
        super();

        this.gestureMap = [];
        this.winner = undefined;

        this.timeLimit = 10 * 1000;

        // gesture
        this.checkActionHandlerList.push(
            (action: GameAction<ITestGameGestureAction>) => {
                let pler = this.playerList[this.turnIndex];
                let { gestureName } = action.actionData;

                let map = this.gestureMap;
                let flag = !map.some(ge => ge.playerName == pler.userName);
                if (!flag) {
                    loger.error(`game::check::HAS PUT GESTURE`);
                }
                return flag;
            }
        );

        // gesture只能是石头剪刀布
        this.checkActionHandlerList.push(
            (action: GameAction<ITestGameGestureAction>) => {
                let pler = this.playerList[this.turnIndex];
                let { gestureName } = action.actionData;

                let map = this.gestureMap;
                console.log(TestGame.gestureList, gestureName);
                let flag = TestGame.gestureList.indexOf(gestureName) >= 0;
                if (!flag) {
                    loger.error(`game::check::NO SUCH GESTURE`);
                }
                return flag;
            });

        this.parseActionHandlerList['gesture'] =
            (action: GameAction<ITestGameGestureAction>) => {
                let pler = this.playerList[this.turnIndex];
                let { gestureName } = action.actionData;

                let map = this.gestureMap;
                map.push({ playerName: pler.userName, gestureName });

                if (map.length == 2) {
                    this.calResult();
                    if (this.winner) {
                        let ro = this.room;
                        let gaResult: ITestGameResult = { winner: this.winner.userName };
                        this.result = gaResult;
                        this.end();
                        return;
                    }
                }

                // 如果游戏没有结束,就继续切换下一个行棋者
                this.notifyTurn();
            };
    };

    afterTimeout():void{
    	let winner = judge(this);
    	if(winner){
    		this.winner = winner;
    		this.result = {
    			winner:this.winner.userName
    		};
    		this.end();
    	}
    };

    turn(): string {
        // 清空所有player的isTurn
        this.playerList.forEach(pler => { pler.isTurn = false; });
        // 确定当前行动的人
        if (this.turnIndex == -1) {
            let se = this.seedGenerator;
            this.turnIndex = parseInt(this.playerList.length * se() + '');
        }
        else {
            this.turnIndex = (this.turnIndex + 1) % this.playerList.length;
        }

        loger.info(`turnIndex:${this.turnIndex}`);

        this.playerList[this.turnIndex].isTurn = true;
        return this.playerList[this.turnIndex].userName;
    };


    private calResult(): void {
        let map = this.gestureMap;
        let geList = TestGame.gestureList;

        let arr: any[] = [{}, {}];
        arr.forEach((n, i) => {
            n.code = geList.indexOf(map[i].gestureName);
        });

        console.log(arr);

        let winnerIndex = -1;
        if (arr[0].code == 0 && arr[1].code == 2) {
            winnerIndex = 0;
        }
        else if (arr[0].code == 2 && arr[1].code == 0) {
            winnerIndex = 1;
        }
        else {
            let sub = arr[0].code - arr[1].code;
            winnerIndex = sub == 0 ? -1 : sub > 0 ? 0 : 1;
        }
        console.log(winnerIndex);
        this.winner = winnerIndex == 0 ? undefined : this.playerList[winnerIndex];
    };

    afterPlayerLogout(playerName: string): void {
        // for temp debug
        // loger.debug(JSON.stringify(this.playerList, null, 4));
        // loger.debug(playerName);

        // 游戏结束,让另一个人获胜
        let pler = _.find(this.playerList, pler => { return pler.userName != playerName });
        this.winner = pler;

        this.result = { winner: this.winner.userName };
        this.end();

    };

    afterPlayerDisconnect(playerName: string) {
    	super.afterPlayerDisconnect(playerName);

        let pler = _.find(this.playerList, pler => pler.userName == playerName);
        if (pler) {
            pler.offlineCount++;
            pler.offlineTs = Date.now();
        }

        // 检测是否超出重连次数
        // todo
    };

    afterPlayerReconnect(playerName: string) {
        super.afterPlayerReconnect(playerName);

        let flag = this.playerList.every(pler => !pler.isOffline);
        if (flag) {
            this.status = EGameStatus.Play;
            this.notifyStatusChanged();
        }
    };
}