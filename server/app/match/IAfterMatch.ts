import IMatchInfo from './iMatchInfo';
import { Room } from '../room/room';
interface IAfterMatch {
    (matched: IMatchInfo[]): Room,
}

export default IAfterMatch;