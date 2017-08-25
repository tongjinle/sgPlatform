import { EGameName, ERoomStatus } from '../struct/enums';
import { User } from './user';
import { Game, GameAction } from './game';
import { Player } from './user/player';
import { Watcher } from './user/watcher';
import { Sanguo } from './game/sanguo';
import loger from './loger';
import { Platform } from './platform';

export class Room {
	id: string;
	platform: Platform;
	playerList: User[];
	maxPlayerCount: number;
	watcherList: User[];
	maxWatcherCount: number;
	canWatch: boolean;
	canPlay: boolean;
	game: Game;

	private _status: ERoomStatus;
	public get status(): ERoomStatus {
		return this._status;
	}
	public set status(v: ERoomStatus) {
		this._status = v;

		if (ERoomStatus.Prepare == v) {

		}
	}

	constructor(gameName: EGameName, playerList: User[]) {
		this.status = ERoomStatus.Prepare;
		// create game;
		let ga = this.game = this.createGame(gameName);
		ga.room = this;
		// push player;
		playerList.forEach(us => {
			let plName = us.userName;
			let pler = new Player(plName);
			ga.playerList.push(pler);
		});

		ga.start();
		this.status = ERoomStatus.Play;
	}

	// 工厂
	private createGame(gameName: EGameName): Game {
		if (EGameName.Sanguo == gameName) {
			return new Sanguo();
		}
	}

	// 
	// 接受游戏操作信息
	accpetAction(action: GameAction): void {
		let ro = this;
		let ga = this.game;

		let { playerName, actionName, actionData } = action;
		loger.info(`acceptAction::${ro.id}::${playerName}::${actionName}::${JSON.stringify(actionData)}`);

		let checkRet: { flag: boolean, reason: string };
		let hasErr: boolean = ga.checkActionHandlerList.some(chHandler => {
			checkRet = chHandler(action);
			if (!checkRet.flag) {
				loger.error(``);
				return true;
			}
		});

		if (!hasErr) {
			ga.parseAction(action);
			let resData = { flag: true };
			ro.notifyAll(ga.updateValueList[ga.updateValueList.length - 1]);
		}
		ro.resPlayer(playerName, { flag: hasErr });
	};

	// 反馈action的操作结果给发起action的player
	// 一般来说,就是反馈一个布尔值,表示是不是action被执行
	resPlayer(playerName: string, data: any) {
		this.playerList.some(pler => {
			if (playerName == pler.userName) {
				pler.socket.emit('resGameAction', data);
				return true;
			}
		});
	};


	// 通知给所有对战者和观战者
	notifyAll(data: any) {
		this.platform.io.to(this.id).emit('notiGameAction', data);
	}
}