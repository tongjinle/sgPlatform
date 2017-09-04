interface IGameTimeLimit{
    timeLimit:number;
    afterTimeout:()=>void;
};

export default IGameTimeLimit;