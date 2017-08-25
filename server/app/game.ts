import { EGameStatus } from '../struct/enums';
import { Player } from './user/player';
import { Room } from './room';
import * as _ from 'underscore';
import loger from './loger';


export interface IGameResult {
	winer: string;
};

export class GameAction {
	playerName: string;
	actionName: string;
	actionData: any;
};

export class Game {
	// 编号
	id: string;
	// 玩家列表
	playerList: Player[];
	// 最大玩家人数
	static maxPlayerCount: number;
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
	// '真实'操作列表
	realActionList: GameAction[];
	// 状态更新列表
	updateValueList: any[];
	// 是否是复盘状态
	isReplay: boolean;


	// 检验操作是否合理
	checkActionHandlerList: ((action: GameAction) => {flag:boolean,reason:string})[];


	constructor() {
		this.id = _.uniqueId();
		this.playerList = [];

	};

	// 开始游戏
	start(): void { };


	// 获取当前回合的选手
	getTurn(): Player {
		let ret: Player;
		return ret;
	};




	// 处理游戏操作信息
	parseAction(action: GameAction): void {

	}


	// 暂停游戏
	pause(): void { };

	// 结束游戏
	end(): void { };




}