import { SpeedItem, SpeedMgr } from '../speedMgr';

let arr: (() => boolean)[] = [];

let equal = (list: SpeedItem[], idList: string[]): boolean => {
    let rst = list.map(li => li.id).join('#');
    let exp = idList.join('#');
    let flag = rst == exp;
    if (!flag) {
        console.log(rst);
    }
    return flag;
};

// 测试normal
// a 速度 .1
// b 速度 .35
// c 速度 .375
// preview 5
// expect [a,a,a,b,c]
arr.push(() => {
    let list: SpeedItem[] = [];
    list.push(new SpeedItem('a', .1, 0));
    list.push(new SpeedItem('b', .35, 0));
    list.push(new SpeedItem('c', .375, 0));
    let mgr = new SpeedMgr();
    mgr.addSet(list);

    let exp = 'a,a,a,b,c'.split(',');
    return equal(mgr.preview(5), exp);
});

// 测试adjust
// a 速度 .1 调整 50
// b 速度 .3 调整 20
// c 速度 .35
// preview 5
// expect [a,a,b,a,c]
arr.push(() => {
    let list: SpeedItem[] = [];
    list.push(new SpeedItem('a', .1, 50));
    list.push(new SpeedItem('b', .3, 20));
    list.push(new SpeedItem('c', .35, 0));
    let mgr = new SpeedMgr();
    mgr.addSet(list);


    let exp = 'a,a,b,a,c'.split(',');
    return equal(mgr.preview(5), exp);


});

// 测试run
// a 速度 .1
// b 速度 .35
// c 速度 .375
// run 1
// preview 5
// expect [a,a,b,c,a]

arr.push(() => {
    let list: SpeedItem[] = [];
    list.push(new SpeedItem('a', .1, 0));
    list.push(new SpeedItem('b', .35, 0));
    list.push(new SpeedItem('c', .375, 0));
    let mgr = new SpeedMgr();
    mgr.addSet(list);

    mgr.run();

    let exp = 'a,a,b,c,a'.split(',');
    return equal(mgr.preview(5), exp);


});

// 测试update
// a 速度 .1 调整 50
// b 速度 .4 调整 0
// c 速度 .8
// b 速度 更新为.15
// preview 5
// expect [a,b,a,b,a]

arr.push(() => {
    let list: SpeedItem[] = [];
    list.push(new SpeedItem('a', .1, 50));
    list.push(new SpeedItem('b', .4, 0));
    list.push(new SpeedItem('c', .375, 0));
    let mgr = new SpeedMgr();
    mgr.addSet(list);

    mgr.update('b',.15);

    let exp = 'a,b,a,b,a'.split(',');
    return equal(mgr.preview(5), exp);


});

arr.forEach((te, i) => {
    console.log(`${i}::test::${te()}`);
});