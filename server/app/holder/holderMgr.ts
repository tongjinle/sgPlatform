import IHolder from './iHolder';
import * as _ from 'underscore';
import iHolder from './iHolder';
import { userInfo } from 'os';
class HolderMgr {
    // 断线用户列表
    holderList: IHolder[];
    // 断线重连的最大时间
    private duration: number;
    constructor(duration: number) {
        this.holderList = [];
        this.duration = duration;
    }

    /**
     * 查找一个断线的userName
     * @param userName 用户名
     */
    find(userName: string): iHolder {
        return this.holderList.find(ho => ho.userName == userName);
    }

    /**
     * 增加一个断线用户
     * @param userName 用户名
     * @param roomIdList 房间id列表
     */
    add(userName: string, roomIdList: string[]): void {
        let timestamp: number = Date.now();
        let ho = _.find(this.holderList, ho => ho.userName == userName);
        if (ho) {
            ho.roomIdList = roomIdList;
            ho.timestamp = timestamp;
        } else {
            ho = { userName, timestamp, roomIdList, };
            this.holderList.push(ho);
        }
    }

    /**
     * 删除一个断线用户
     * @param userName 用户名
     */
    remove(userName: string): void {
        this.holderList = this.holderList.filter(ho => ho.userName === userName);
    }

    /**
     * 清理超过断线重连时间的所有断线用户
     * @returns 返回清理对断线用户的userName列表
     */
    clear(): string[] {
        let ret: string[] = [];
        this.holderList = this.holderList.filter(ho => {
            if (this.isOvertime(ho)) {
                ret.push(ho.userName);
            } else {
                return true;
            }
        });
        return ret;
    }

    /**
     * 断线用户是否超时
     * @param ho 断线用户
     */
    isOvertime(ho: iHolder): boolean {
        let now = Date.now();
        return now - ho.timestamp >= this.duration;
    }
}

export default HolderMgr;