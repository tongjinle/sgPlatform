import { EGameName, ERoomStatus } from '../struct/enums';
import { User } from './user';
import { Player } from './user/player';
import { Watcher } from './user/watcher';



export class Room {
	id: string;
	playerList: Player[];
	maxPlayerCount: number;
	watcherList: Watcher[];
	maxWatcherCount: number;
	gameName: EGameName;
	canWatch: boolean;
	canPlay: boolean;
	status: ERoomStatus;
}