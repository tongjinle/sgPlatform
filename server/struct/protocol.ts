import {
    EChatType,
    EPlatformStatus,
    EUserStatus,
    EGameStatus,
    EFlagColor,
    EGameName,
    EGameInfoType
} from './enums';

// ##### to client event #####

// 登录
export interface IReqLogin {
    userName: string,
    password: string,
};

export interface IResLogin {
    flag: boolean,
    code: number,
};

export interface INotifyLogin {
    userName: string,
};

// 登出
export interface IReqLogout {
};

export interface IResLogout {
    flag: boolean,
};

export interface INotifyLogout {
    userName: string,
};

// 断线
export interface INotifyDisconnect {
    userName: string,
};


// 进入房间
export interface IReqUserJoinRoom {
    roomId: string,
};

export interface IResUserJoinRoom {
    flag: boolean,
    roomId: string,
};

export interface INotifyJoinRoom {
    roomId: string,
    userName: string,
};


// 退出房间
export interface IReqUserLeaveRoom {
    roomId: string,
};

export interface IResUserLeaveRoom {
    flag: boolean,
};

export interface INotifyLeaveRoom {
    roomId: string,
    userName: string,
};




// 聊天
export interface IReqChat {
    message: string,
    type: EChatType
    // 在某个房间的聊天
    roomId?: string,
    // to是对某人的私人聊天
    to?: string,
};

export interface IResChat {
    flag: boolean,
};

export interface INotifyChat {
    from: string,
    type: EChatType,
    message: string,
    timestamp: number,
};

// 用户当前的游戏信息
export interface IGameInfo {
    // 玩家数量
    palyerCount: number,
    // 观战者数量
    watcherCount: number,
    // 
    stepCount: number,
    startTimestamp: number,
    endTimestamp: number,
    currTimestamp: number,
    winColor: EFlagColor,
    status: EGameStatus,
};

// 用户信息
export interface IUserInfo {
    userName: string,
    userStatus: EUserStatus,
    roomIdList: string[],
    gameInfo: IGameInfo,
};

// 获取在线用户列表
export interface IReqOnlineUserList {

};

export interface IResOnlineUserList {
    flag: boolean,
    list: IUserInfo[],
};


export interface IGameRule {
    playerCount: number,
};

// 匹配游戏
export interface IReqMatchGame {
    // 游戏名字
    name: string,
    extData: any,
};

export interface IResMatchGame {
    flag: boolean,
    code: number,

};

export interface INotifyMatchingGame { }

export interface INotifyMatchGame {
    roomId: string,
    userNameList: string[],
};

// 游戏操作
export interface IReqGameAction<T> {
    roomId: string,
    actionName: string,
    actionData: T,
};

export interface IResGameAction {
    flag: boolean,
};


export interface INotifyGameAction<T> {
    // 用来维护队列次序
    // 因为在向客户端发送多个notify的时候,不能保证它们是能够按照一个顺序到达客户端的
    actionIndex: number,
    actionName: string,
    data: T,
};


//游戏开始
export interface INotifyGameStart {
    roomId: string,
    gameName: EGameName,
    playerNameList: string[],
};


// 游戏结束
export interface INotifyGameEnd<T> {
    roomId: string,
    result: T,
};

// 回合切换

// 请求当前回合的玩家
// ** 一般来说,是
export interface IReqGameTurn {
    roomId: string,
};

export interface IResGameTurn { }

export interface INotifyGameTurn {
    roomId: string,
    playerName: string,
    turnIndex: number,
};


// 游戏状态update
export interface INotifyGameUpdate {

};