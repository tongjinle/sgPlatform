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


	constructor(gameName: EGameName, playerNameList: string[]) {
		// create game;
		this.createGame(gameName);
		// push player;
		playerNameList.forEach(plName => {
			let pler = new Player(plName);
			this.playerList.push(pler);
			this.status = ERoomStatus.Play;
		});
	}

	// 工厂
	private createGame(gameName: EGameName): void {
		if(EGameName.Sanguo==gameName){

		}
	}

}