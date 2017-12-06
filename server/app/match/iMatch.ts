import IMatchInfo from './iMatchInfo';

// 匹配算法接口
export default interface IMatch {
    (list: IMatchInfo[]): IMatchInfo[],
}
