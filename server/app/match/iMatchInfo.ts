import {EGameName} from '../../struct/enums';

// 等候匹配的数据格式接口
export default interface IMatchInfo {
    id: string,
    gameName: EGameName,
    data: any,
};