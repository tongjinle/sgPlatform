// import { ICheckAction, GameAction, EGameEvent, } from '../game';
// import Plug from './plug';
// import loger from '../../loger';

// interface IRoundData {
//     turnIndex: number,
// }

// class RoundPlug extends Plug {
//     constructor() {
//         super();
//     }

//     protected initCheckActionHandlerList(list: ICheckAction[]) {
//         let ga = this.game;
//         let data = this.data as IRoundData;
//         // 没有行棋者 或者 非行棋者发出请求
//         let ch: ICheckAction = (ac) => {
//             let pler = ga.playerList[data.turnIndex];
//             let flag = !!pler;
//             if (!flag) {
//                 loger.error(`game::check::ERR NO SUCH PLAYER OR NOT TURN`);
//             }
//             return flag;

//         };

//         list.push(ch);

//     }

//     protected listen() {
//         let ga = this.game;
//         ga.on(EGameEvent.afterParseAction,()=>{
//             let ga = this.game;
//             let data = this.data as IRoundData;
//             data.turnIndex = (data.turnIndex + 1) % ga.playerList.length;
//         });
//     }

// }

// export default RoundPlug;