import { EGameStatus } from '../../struct/enums';
import EGamePlayerStatus from './eGamePlayerStatus';
import { Game } from '../game/game';

export class Player {
	userName: string;
	status:EGamePlayerStatus;
	// gameStatus: EGameStatus;
	// // 上一次动作时间,包括所有动作
	// lastActionTs: number;
	// // 断线时间戳
	// offlineTs: number;
	// // 断线次数
	// offlineCount: number;
	// // 是否是我的回合
	// isTurn: boolean;
	// 游戏实例
	game: Game;


	constructor(userName:string){
		this.userName = userName;
		// this.offlineTs = -1;
		// this.offlineCount = 0;
		// this.lastActionTs = -1;
		// this.isTurn = false;
	}
}