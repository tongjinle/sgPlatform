import IMatchInfo from './iMatchInfo';

interface IAfterMatch {
    (matched: IMatchInfo[]): void
}

export default IAfterMatch;