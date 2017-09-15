import { Position } from './position';
import { ChessBoard } from './chessBoard';
import { Chess } from './chess';


export class Box {
    position: Position;
    chessBoard: ChessBoard;

    // 是否可以行走
    canMove: boolean;
    // 是否视野通过
    isVisiable: boolean;
    // 是否可以建造建筑
    canBuild: boolean;
    // ZOC,移动到边上,就会卡住棋子行动
    isZOC: boolean;


    enterChessBoard(chessBoard: ChessBoard): void {
        this.chessBoard = chessBoard;

        this.chessBoard.boxList.push(this);
    };

    // 当棋子移动
    // 由具体的子类去实现
    protected onChessMove(chess: Chess) {

    }



}