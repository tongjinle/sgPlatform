import { EGameName, ERoomStatus } from '../struct/enums';
import { User } from './user';

export class Room {
	id: number;
	playerList: User[];
	maxPlayerCount: number;
	watcherList: User[];
	maxWatcherCount: number;
	gameName: EGameName;
	canWatch: boolean;
	canPlay: boolean;
	status: ERoomStatus;
}