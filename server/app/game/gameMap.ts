import { EGameName } from '../../struct/enums';
import { Game, IGameInitData } from './game';
import { TestGame } from './gallery/testGame/testGame';
import { HonestGame } from './gallery/honest/honest';

let GameMap: { [gameName: number]: typeof Game} = {
    [EGameName.TestGame]: TestGame,
    [EGameName.Honest]: HonestGame,
};


export default GameMap;