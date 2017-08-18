import * as _ from "underscore";
import * as $ from "jquery";
import * as io from "socket.io-client";
import * as async from "async";
import Reqs from "./reqs";

let opts: SocketIOClient.ConnectOpts = {
    reconnection: false,
    // autoConnect:false,
    forceNew: true
};
let so: SocketIOClient.Socket = io("http://localhost:1216", opts);
let $login: JQuery,
    $pathnode: JQuery,
    $userList: JQuery,
    $chatbox: JQuery
    ;

let g_username: string;
let g_token: string;

const RECEIVER_KEY = 'isPrivateReceiver';
const RECEIVER_CLASS = 'privateReceiver';

let reqs: Reqs;

async.parallel([
    (cb) => {
        $(() => {
            // $('body').html(new Date().toLocaleTimeString());
            $login = $('#login');
            $pathnode = $('#pathnode');
            $chatbox = $('#chatbox');
            $userList = $('#pathnode .userList');
            $pathnode = $('#pathnode');
            cb();
        });
    },
    (cb) => {
        so.on("connect", () => {
            console.log(so.id);
            cb();
        });
    }
], (err, data) => {
    !err && start();
});

function start() {
    initPage();
    initReqs();
    bindSocket();
    bindEvent();
}


// 初始化页面
function initPage() {
    $login.show();
    $pathnode.hide();

    // for easy test
    $login.find('.username').val('falcon');
    $login.find('.username').click(function() {
        $(this).val('dino');
    });
}



// 主要用于接受来自server的信息
function bindSocket() {
    so.on("login", (data: { flag: boolean, username: string }) => {
        let { flag, username } = data;
        $login.toggle(!flag);
        $pathnode.toggle(flag);

        if (flag) {
            g_username = username;
            reqs.userList();
            reqs.subPathnodeList();
        } else {
            alert("login fail...");
        }
    });

    so.on('reconnect', () => {
        console.log('reconnect success');
    });

    so.on("userList", (data: { flag: boolean, userList: string[] }) => {
        let { flag } = data;
        if (flag) {
            $userList
                .empty()
                .append(_.map(data.userList, createUserHtml).join(''));
        }
    });

    so.on("userJoin", (data: { flag: boolean, pathnodeName: string, username: string }) => {
        let { flag, pathnodeName, username } = data;
        if (flag) {
            $userList.append(createUserHtml(username));
        }
    });

    so.on("userLeave", (data: { flag: boolean, pathnodeName: string, username: string }) => {
        let { flag, pathnodeName, username } = data;
        if (flag) {
            $userList
                .find(".username")
                .each(function() {
                    if ($(this).text() == username) {
                        $(this).remove();
                    }
                });
        }
    });


    so.on("chat", (data: { flag: boolean, username: string, message: string, isPrivate: boolean, timestamp: number }) => {
        let { flag, username, message, isPrivate, timestamp } = data;
        if (flag) {
            $chatbox.find('.messageList').append(createMessageHtml(username, message, isPrivate, timestamp));
        }

    });

    so.on("subPathnodeList", (data: { flag: boolean, subPathnodeList: { pathnodeName: string, currUserCount: number, maxUserCount: number, status: number }[] }) => {
        let { flag, subPathnodeList } = data;
        if (flag) {
            let html: string = _.map(subPathnodeList, subPathnode => {
                let { pathnodeName, currUserCount, maxUserCount, status } = subPathnode;
                return createSubPathnodeHtml(pathnodeName, currUserCount, maxUserCount, status);
            }).join('');

            $pathnode.find('.subPathnodeList')
                .append(html);
        }
    });

    so.on('disconnect', () => {
        $login.toggle(true);
        $pathnode.toggle(false);
    });
}


// 主要用于
function bindEvent() {
    // login
    $login.find('.login').click(function() {
        let username = $login.find('.username').val();
        let password = $login.find('.password').val();
        reqs.login(username, password);
    });

    // cancel
    $login.find('.cancel').click(function() {
        $login.find('.username').val('');
        $login.find('.password').val('');
    });

    // chat
    $chatbox.find('.sendMessage').click(function() {
        let message: string = $chatbox.find('.inputbox').val();
        let to: string = getPrivateReceiver();
        if (message.length) {
            reqs.chat(message, to);
        }
    });
    $chatbox.find('.clearMessage').click(function() {
         $chatbox.find('.inputbox').val('');
    });

    // select private receiver
    $userList.on('click', '.username', function() {
        // 不能对自己私密
        if ($(this).text() == g_username) {
            return;
        }

        let key = RECEIVER_KEY;
        let className = RECEIVER_CLASS;
        let flag: boolean = !$(this).data(key);
        $(this).data(key, flag);
        if (flag) {
            $(this).addClass(className);

        } else {
            $(this).removeClass(className);
        }
        $(this).siblings('.username').data(key, false)
            .removeClass(className);;
    });

    // enter subPathnode
    // todo

}

function initReqs() {
    reqs = new Reqs(so);
}

// 生成子级pathnode列表
function createSubPathnodeHtml(pathnodeName: string, currUserCount: number, maxUserCount: number, status: number) {
    // todo
    let statusFormat = (status: number): string => {
        let className: string;
        className = ['', '', ''][status];
        return className;
    };
    return `
        <div class="subPathnode">
            <span class="status ${statusFormat(status)}"></span>
            <span class="pathnodeName">${pathnodeName}</span>
            <span class="userCount">${currUserCount}/${maxUserCount}</span>
        </div>
    `;
}



// 生成user节点
function createUserHtml(username: string) {
    return `<div class="username">${username}</div>`;
}


// 生成message节点
function createMessageHtml(username: string, message: string, isPrivate: boolean, timestamp: number) {
    let timeFormat = (timestamp: number) => {
        let time = new Date(timestamp);
        let str = [time.getHours(), time.getMinutes(), time.getSeconds()].join(':');
        return str;
    };

    return `
        <div class="message ${username==g_username?'isSelf':''}"> 
            <span class="username">${username}</span>
            <span class="text ${isPrivate ? 'private' : ''}">${message}</span>
            <span class="timestamp">${timeFormat(timestamp)}</span>
        </div>
    `;
}

// 获取私密对象
function getPrivateReceiver(): string {
    let receiver: string = undefined;
    $userList.find('.username').each(function(i, n) {
        if ($(this).data(RECEIVER_KEY)) {
            receiver = $(this).text();
            return false;
        }
    });
    return receiver;
}