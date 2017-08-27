import { Game } from '../game';
import { Player } from '../user/player';
import * as _ from 'underscore';
import loger from '../loger';


export class TestGame extends Game {

	constructor() {
		super();
		// code...

	}

	turn(): string {
		let se = this.seedGenerator;
		// 清空所有player的isTurn
		this.playerList.forEach(pler => { pler.isTurn = false;});
		// 确定当前行动的人
		if (this.turnIndex == -1) {
			this.turnIndex = parseInt(this.playerList.length * se() + '');
		}
		else {
			this.turnIndex = (this.turnIndex + 1) % this.playerList.length;
		}

		loger.info(`turnIndex:${this.turnIndex}`);

		this.playerList[this.turnIndex].isTurn = true;
		return this.playerList[this.turnIndex].userName;
	}
}