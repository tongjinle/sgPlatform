import * as _ from 'underscore';
import { Box } from './box';
// box types
import { FlatBox } from './box/flat';
import { WaterBox } from './box/water';
import { HillBox } from './box/hill';
// 
import { Chess } from './chess';
import {Army} from './army';
import { EventEmitter } from 'events';
import { Position } from './position';
import { SpeedItem, SpeedMgr } from './speedMgr';
import * as SRnd from 'seedrandom';
import * as fs from 'fs';

interface IMapData{
    data:number[][],
    guardCount:number,
    heroCount:number
}

export class ChessBoard extends EventEmitter {
    boxList: Box[];
    chessList: Chess[];
    speedMgr: SpeedMgr;
    seed: number;
    rndGenerator: SRnd.prng;

    constructor() {
        super();
        this.boxList = [];
        this.chessList = [];
        this.seed = Math.random();
        this.speedMgr = new SpeedMgr();
        this.rndGenerator = SRnd(this.seed.toString());
    }

    getChessByPosition(position: Position): Chess {
        return _.find(this.chessList, ch => ch.position.equal(position));
    }

    // 获取当前的行动棋子
    getCurrChess(): Chess {
        return undefined;
    }

   
    addChess(chess: Chess) {
        chess.enterChessBoard(this);

        let adjust = this.rndGenerator.int32();
        this.speedMgr.add(new SpeedItem(chess.id, chess.speed, adjust));
    }

    loadMap(mapName: string = 'basic') {
        let path = './map/' + mapName;
        let mapData:IMapData = JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }));

        let arr = [FlatBox, WaterBox, HillBox];

        mapData.data.forEach((row, rowIndex) => {
            row.forEach((boxData, colIndex) => {
                if (boxData != -1) {
                    let bo: Box = new arr[boxData]();
                    bo.position = new Position(colIndex, rowIndex);

                    bo.enterChessBoard(this);
                }
            });
        });
    }

    // 加载一个队伍配置
    loadArmy(army:Army){}
    
    

    // 下个回合
    turn() {

    }
}