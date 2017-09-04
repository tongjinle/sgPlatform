import { Game } from './game';
import IGameTimeLimit from './iGameTimeLimit';

export class LimitGame extends Game implements IGameTimeLimit {
    timeLimit: number;

    // 让具体的游戏去实现
    afterTimeout():void{}
}