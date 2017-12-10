import { EGameStatus, } from '../../../struct/enums';
import { Game, IGameInitData, EGameEvent, GameAction, ICheckAction, } from '../game';
import { Player } from '../../user/player';
import * as Protocol from '../../../struct/protocol';
import loger from '../../loger';

class RoundGame extends Game {
    private turnIndex: number;

    private _currPlayer: Player;
    public get currPlayer(): Player {
        return this.turnIndex == -1 || !this.playerList || this.playerList.length == 0
            ?
            undefined
            :
            this.playerList[this.turnIndex];
    }

    constructor() {
        super();
        this.turnIndex = -1;

        this.listen();
    }

    protected initCheckActionHandlerList(): void {
        super.initCheckActionHandlerList();

        let list = this.checkActionHandlerList;

        // 必须是当前行动用户,如果是"真实"操作
        let checkAction: ICheckAction = (action: GameAction<any>) => {
            let { playerName, actionName } = action;
            if (!this.isRealAction(actionName)) { return true; }
            return this.currPlayer && playerName == this.currPlayer.userName;
        }
        list.push(checkAction);
    }


    private listen() {
        this.once(EGameEvent.afterStart, () => {
            loger.debug(`roundGame::event-afterStart`);
            this.notifyTurn();
        });

        this.on(EGameEvent.afterParseAction, (action: GameAction<any>) => {
            if (this.status == EGameStatus.End) { return; }
            console.log(this.realActionNameList);
            console.log(action.actionName);
            if (this.realActionNameList.indexOf(action.actionName) >= 0) {
                this.notifyTurn();
            }
        });
    }

    // 获取当前回合的选手
    // 需要具体的游戏去重写这个方法
    protected turn(): void {
        if (this.playerList.length == 0) {
            this.turnIndex = -1;
        } else {
            this.turnIndex = (this.turnIndex + 1) % this.playerList.length;
        }
        loger.debug(`turn::${this.turnIndex}`);
    };


    notifyTurn(): void {
        this.turn();

        if (this.currPlayer) {
            let plNameInTurn = this.currPlayer.userName;
            let ro = this.room;
            let notiData: Protocol.INotifyGameTurn = {
                roomId: ro.id,
                playerName: plNameInTurn,
                turnIndex: this.turnIndex
            };
            ro.notifyAll('notiGameTurn', notiData);
            loger.info(`game::notifyGameTurn::${JSON.stringify(notiData)}`);
        }
        else {
            loger.error(`game::notifyTurn::${this.playerList.map(pl => pl.userName + '==' + pl.isTurn).join('\n')}`);
        }
    }
}


export default RoundGame;
