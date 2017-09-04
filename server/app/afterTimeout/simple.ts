import { LimitGame } from '../LimitGame';
import {Player} from '../user/player';
import * as _ from 'underscore';

export function judge(game: LimitGame): Player {
    let ret: Player;
    let pler = _.find(game.playerList,pler=>!pler.isOffline);
    if(pler){
        ret = pler;
    }
    return ret;
};