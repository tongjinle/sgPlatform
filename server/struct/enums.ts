// 聊天类型
// 世界聊天,房间聊天,私人聊天
export enum EChatType {
	Platform,
	Room,
	Personal
};

// 平台自身状态
// 正常 暂停 关闭
export enum EPlatformStatus {
	Open,
	Pause,
	Close
};

// 用户的平台状态
// 在线, 离线
export enum EUserStatus {
	Online,
	Offline
};

// 房间状态
// 预备中 进行中 暂停 结束
export enum EGameStatus{
	Prepare,
	Play,
	Pause,
	End
};


// // 空闲,观战,游戏中
// export enum EPlayerStatus {
// 	Free,
// 	Watch,
// 	Play
// };


// 队伍颜色
export enum EFlagColor {
	Black,
	Red,
	Green
};

// 游戏类型
export enum EGameName {
	TestGame,
	Sanguo,
	Majiang,
	ChineseChess
};


// 游戏信息类型
export enum EGameInfoType{
	Action,
	Query,
	// 系统主动发出的通知
	// 比如"游戏开始"这样的
	Start,
	Pause,
	Resume,
	End	
};

