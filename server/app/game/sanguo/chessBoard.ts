import * as _ from 'underscore';
import { Box } from './box';
// box types
import { FlatBox } from './box/flat';
import { WaterBox } from './box/water';
import { HillBox } from './box/hill';
// 
import { Chess, EChessColor } from './chess';
import { Army } from './army';
import { EventEmitter } from 'events';
import { Position } from './position';
import { SpeedItem, SpeedMgr } from './speedMgr';
import * as SRnd from 'seedrandom';
import * as fs from 'fs';

interface IMapData {
    data: number[][],
    guardCount: number,
    heroCount: number
}

export enum EChessBoardStatus {
    // 棋子的调整阶段
    preStart,
    start,
    end
}

export class ChessBoard extends EventEmitter {
    boxList: Box[];
    chessList: Chess[];
    speedMgr: SpeedMgr;
    seed: number;
    rndGenerator: SRnd.prng;
    status: EChessBoardStatus;

    constructor() {
        super();
        this.boxList = [];
        this.chessList = [];
        this.seed = Math.random();
        this.speedMgr = new SpeedMgr();
        this.rndGenerator = SRnd(this.seed.toString());
        this.status = ChessBoardStatus.preStart;
    }

    getChessByPosition(position: Position): Chess {
        return _.find(this.chessList, ch => ch.position.equal(position));
    }

    getBoxByPosition(position: Position): Box {
        return _.find(this.boxList, bo => bo.position.equal(position));
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
        let mapData: IMapData = JSON.parse(fs.readFileSync(path, { encoding: 'utf-8' }));

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

    // 在布阵阶段,可以调整棋子位置
    resetChessPosition(chess: Chess, position: Position) {
        //  check
        // 1 在调整阶段
        // 2 位置没有重复
        // 3 位置是我方可以使用的位置
        // 4 位置的box是canMove的

        if (EChessBoardStatus.preStart != this.status) { return; }
        if (this.getChessByPosition(position)) { return; }
        // 临时,以后地图可能要变
        if (EChessColor.red == chess.color && position.y >= 2) { return; }
        if (EChessColor.black == chess.color && position.y <= 9) { return; }
        {
            let box = this.getBoxByPosition(position);
            if (!box || !box.canMove) { return; }
        }

        // 成功
        chess.resetPosition(position);
        
    }

    // 加载一个队伍配置
    loadArmy(army: Army) { }



    // 下个回合
    turn() {

    }
}