import * as io from "socket.io-client";
class Reqs{
	so:SocketIOClient.Socket;
	constructor(so:SocketIOClient.Socket) {
		this.so = so;
	}

	  // 登陆
    login(username: string, password: string) {
        this.so.emit('login', { username, password });
    };

    // 登出
    logout() {
        this.so.emit('logout');
    };

    // 获取用户
    userList() {
        this.so.emit('userList');
    };

    // 聊天
    chat(message: string, to?: string) {
        this.so.emit('chat', { message, to });
    };

    // 获取子节点信息
    subPathnodeList(){
        this.so.emit('subPathnodeList');
    }


}

export default Reqs; 