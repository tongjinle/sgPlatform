import { Game } from '../game';
import { Player } from '../user/player';
import * as _ from 'underscore';

export class TestGame extends Game {

	constructor() {
		super();
		// code...

		// this.turnIndex = -1;
	}

	turn(): string {
		let se = this.seedGenerator;
		if (this.turnIndex == -1) {
			this.turnIndex = parseInt(this.playerList.length * se() + '');
		}
		else {
			this.turnIndex = (this.turnIndex + 1) % this.playerList.length;
		}
		return this.playerList[this.turnIndex].userName;
	}
}