import * as _ from 'underscore';
import * as SRnd from 'seedrandom';
import { EGameStatus, EGameName } from '../../struct/enums';
import { Player } from '../user/player';
import { Room } from '../room/room';
import loger from '../loger';
import * as Protocol from '../../struct/protocol';
// import Plug from './plug/plug';
import { EventEmitter } from 'events';

export interface IGameResult {
	winer: string;
};

export class GameAction<T> {
	playerName: string;
	actionName: string;
	actionData: T;
};

export interface IGameInitData {
};

export interface ICheckAction {
	(action: GameAction<any>): boolean,
}

export enum EGameEvent {
	beforeParseInitData = 'beforeParseInitData',
	afterParseInitData = 'afterParseInitData',

	beforeStart = 'beforeStart',
	afterStart = 'afterStart',

	beforeCheckAction = 'beforeCheckAction',
	afterCheckAction = 'afterCheckAction',

	beforeParseAction = 'beforeParseAction',
	afterParseAction = 'afterParseAction',

	beforePause = 'beforePause',
	afterPause = 'afterPause',

}


export class Game extends EventEmitter {
	// 编号
	id: string;
	// 玩家列表
	playerList: Player[];
	// 随机种子
	seed: number;
	// 游戏所属的房间
	room: Room;
	// 游戏状态
	status: EGameStatus;
	// 开始时间戳
	startTimestamp: number;
	// 结束时间戳
	endTimestamp: number;
	// 游戏结果
	result: IGameResult;
	// 初始状态
	initValue: any;
	// 当前状态
	currValue: any;
	// '真实'操作名列表
	realActionNameList: string[];
	// '真实'操作列表
	realActionList: GameAction<any>[];
	// 状态更新列表
	updateValueList: any[];
	// 是否是复盘状态
	isReplay: boolean;
	// 插件数据
	// plugList: Plug[];

	// 随机种子发生器
	protected seedGenerator: SRnd.prng;
	// 检验操作是否合理
	protected checkActionHandlerList: ICheckAction[];
	// 处理操作列表
	protected parseActionHandlerList: { [actionName: string]: (action: GameAction<any>) => void };



	constructor() {
		super();

		this.id = _.uniqueId();
		this.seed = 10000;
		this.seedGenerator = SRnd(this.seed.toString());
		this.playerList = [];
		this.checkActionHandlerList = [];
		this.parseActionHandlerList = {};
		this.updateValueList = [];

		this.realActionNameList = [];
		this.realActionList = [];

		// this.plugList = [];

		this.status = EGameStatus.Prepare;

		// check init
		this.initCheckActionHandlerList();
	};




	protected initCheckActionHandlerList(): void {
		let list = this.checkActionHandlerList;

		// 游戏不在play的状态
		list.push((action: GameAction<any>) => {
			let flag = this.status == EGameStatus.Play;
			if (!flag) {
				loger.error(`game::check::NOT PLAY STATUS`);
			}
			return flag;
		});




	}

	// addPlug(plug: Plug): void {
	// 	// 同一个plug不应该加载两次
	// 	if (this.plugList.some(pl => pl.name == plug.name)) { return; }

	// 	this.plugList.push(plug);
	// 	plug.attachGame(this);

	// }

	// 开始游戏
	start(): void {
		this.emit(EGameEvent.beforeStart);

		this.status = EGameStatus.Play;
		let ro = this.room;
		let notiData: Protocol.INotifyGameStart = {
			roomId: ro.id,
			gameName: ro.gameName,
			playerNameList: this.playerList.map(pler => pler.userName),
		};

		ro.notifyAll('notiGameStart', notiData);
		loger.info(`game::start::${ro.id}::${EGameName[ro.gameName]}`);

		this.emit(EGameEvent.afterStart);

	};



	// 解析游戏需要的extData
	parseInitData(initData: IGameInitData) {
		this.emit(EGameEvent.afterParseInitData, initData);
	}


	// 检验玩家发出的游戏操作
	checkAction(action: GameAction<any>): boolean {
		let ret: boolean;
		let list = this.checkActionHandlerList;
		return list.every(handler => handler(action));
	};



	// 处理游戏操作信息
	parseAction(action: GameAction<any>): void {

		let list = this.parseActionHandlerList;
		let handler = list[action.actionName];
		if (handler) {
			this.emit(EGameEvent.beforeParseAction, action);
			handler(action);

			if (this.realActionNameList.indexOf(action.actionData) >= 0) {
				this.realActionList.push(action);
			}
			this.emit(EGameEvent.afterParseAction, action);

		}


	};


	// 暂停游戏
	pause(): void {
		this.status = EGameStatus.Pause;
		this.emit(EGameEvent.afterPause);
	};


	// 结束游戏
	end(): void {
		this.status = EGameStatus.End;
	};

	protected isRealAction(actionName: string): boolean {
		return this.realActionNameList.indexOf(actionName) >= 0;
	}


}