import * as _ from 'underscore';

export class SpeedItem {
    id: string;
    speed: number;
    // 调整速度,防止相同速度棋子出现
    adjust: number;
    // 经过的tab
    tab: number;

    public get next(): number {
        return this.speed + this.tab;
    }

    constructor(id: string, speed: number, adjust: number) {
        this.id = id;
        this.speed = speed;
        this.adjust = adjust;
        this.tab = 0;

    }
}

export class SpeedMgr {
    list: SpeedItem[];

    constructor() {
        this.list = [];
    }

    public get firstItem(): SpeedItem {
        return this.list[0];
    }

    addSet(list:SpeedItem[]){
        this.list = this.list.concat(list);
        this.sort();
    }

    add(item: SpeedItem) {
        this.list.push(item);
        this.sort();
    };

    remove(id: String) {
        let index = _.findIndex(this.list, li => li.id == id);
        if (index != -1) {
            this.list.splice(index, 1);
            this.sort();
        }
    };

    update(id: string, speed: number) {
        let item = _.find(this.list, li => li.id == id);
        if (item) {
            item.speed = speed;
            this.sort();
        }
    };

    // 切换回合
    // 同时要修改speedPoint
    sort(): void {
        this.list.sort(
            (a, b) => a.next == b.next ?
                a.adjust - b.adjust :
                a.next - b.next
        );
    }


    // 当list中有任何改变的时候
    run(): void {
        this.firstItem.tab += this.firstItem.speed;
        this.sort();

        // console.log(this.list);
    }

    // 预览
    preview(len: number): SpeedItem[] {
        let ret: SpeedItem[] = [];
        // 记录他们的tab
        let mem: { [id: string]: number } = {};
        this.list.forEach(li => {
            mem[li.id] = li.tab;
        });
        // 模拟运行
        while (len--) {
            ret.push(this.firstItem);
            this.run();
        }
        // 恢复tab
        _.each(mem, (val, key) => {
            let item = _.find(this.list, li => li.id == key);
            item.tab = val;
        });
        return ret;
    }

}



