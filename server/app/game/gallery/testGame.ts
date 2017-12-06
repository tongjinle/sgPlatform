import { Game, GameAction, IGameInitData, } from '../game';
import { Player } from '../../user/player';
import * as _ from 'underscore';
import loger from '../../loger';
import * as Protocol from '../../../struct/protocol';

// gesture data struct
export interface ITestGameGestureAction {
    gestureName: string;
};

// gameEnd data struct
export interface ITestGameEnd {
    winner: string;
};

export class TestGame extends Game {
    private gestureMap: { playerName: string, gestureName: string }[];
    private winner: Player;
    private static gestureList = ['bu', 'jiandao', 'cuizi'];

    constructor(initData: IGameInitData) {
        super(initData);

        this.gestureMap = [];
        this.winner = undefined;

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
                        let notiData: Protocol.INotifyGameEnd<ITestGameEnd> = {
                            roomId: ro.id,
                            result: {
                                winner: this.winner.userName
                            }
                        };
                        ro.notifyAll('notiGameEnd', notiData);
                        ro.end();
                        return;
                    }
                }

                // 如果游戏没有结束,就继续切换下一个行棋者
                this.notifyTurn();
            };
    }

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
    }


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
    }
}