import { Room } from './room';
import * as _ from 'underscore';

class RoomMgr {
    private roomList: Room[];

    constructor() {
        this.roomList = [];
    }

    add(...roomList: Room[]): void {
        this.roomList.push(...roomList);
    }

    remove(...roomList: Room[]) :void{
        this.roomList = this.roomList.filter(ro => roomList.every(ro2 => ro2 != ro));
    }

    findByRoomId(id: string): Room {
        return _.find(this.roomList, ro => ro.id == id);
    }
}

export default RoomMgr;