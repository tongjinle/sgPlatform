// import {
//     Game,
//     GameAction,
//     ICheckAction,
//     EGameEvent,
// } from '../game';

// class Plug {
//     // 插件名
//     name: string;
//     // 游戏实例
//     public game: Game;
//     // 供插件用的数据
//     public data: any;
//     constructor() {
//     }

//     attachGame(game: Game) {
//         this.game = game;

//         let ga = this.game;
//         this.initCheckActionHandlerList(ga.checkActionHandlerList);

//         this.listen();
//     }


//     // 由子类实现
//     protected initCheckActionHandlerList(list: ICheckAction[]) {

//     }

    

//     protected listen() {

//     }
// }

// export default Plug;