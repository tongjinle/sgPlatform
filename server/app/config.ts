let platform = {
    port: 1216,

    // match间隔
    matchInterval:500,
    // 清理超过时间的用户的clear间隔
    clearInterval:1000,
    // 重连时间
    holdDuration: 5 * 60 * 1000,
};


let config = {
    platform,
};

export default config;