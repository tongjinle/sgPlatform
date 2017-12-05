import { EGameName } from '../struct/enums';
import { IGameInitData, Game, GameAction } from './game';

import { HonestGame, IHonestGameInitData } from './game/honest';
import { TestGame } from './game/testGame';

export function createGame(gameName: EGameName, initData: IGameInitData): Game {
    if (EGameName.Sanguo == gameName) {
        // return new Sanguo(initData);
    }
    else if (EGameName.TestGame == gameName) {
        return new TestGame(initData);
    }
    else if (EGameName.Honest == gameName) {
        return new HonestGame(initData as IHonestGameInitData);
    }
}