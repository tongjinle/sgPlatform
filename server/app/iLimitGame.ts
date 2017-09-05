export interface ILimitGame{
    // 最大允许重连时间
    timeLimit:number;
    // 最多次的重连次数
    countLimit:number;
    afterTimeout:()=>void;
};
