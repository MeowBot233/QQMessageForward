"use strict"

require("dotenv").config();
const qq = require("icqq");

const PUSH_TARGET = process.env.PUSH_TARGET;
const THREAD_ID = Number(process.env.THREAD_ID);
const MAX_RETRIES = Number(process.env.MAX_RETRIES);
const API_URL = process.env.API_URL || "https://push.meowbot.page/push";
const QQ_PLATFORM = process.env.QQ_PLATFORM;
const QQ_DATA_DIR = process.env.QQ_DATA_DIR;
const SUBSCRIBE = process.env.SUBSCRIBE;

if(!PUSH_TARGET) {
    console.error("请设置PUSH_TARGET环境变量！");
    process.exit(1);
}

// 处理订阅
let allPrivate = false;
let allGroup = false;
let allGroupAt = false;
/** @type Set<number> */
let privateSet = new Set();
/** @type Map<number, { at: boolean, sub?: Set<number> }> */
let groupMap = new Map();

const subs = SUBSCRIBE.split(' ');


// 屎山代码能跑就行，别动！
subs.forEach((v) => {
    try {
        if(v == 'Pall') {
            allPrivate = true;
            return;
        }
        if(v == 'Gall') {
            allGroup = true;
            return;
        }
        if(v == 'Gall@') {
            allGroupAt = true;
            return;
        }
        if(v[0] == 'P') {
            const id = Number(v.substring(1, v.length));
            privateSet.add(id);
        }
        if(v[0] == 'G') {
            let at = false;
            if(v.endsWith('@')) {
                at = true;
                v = v.substring(0, v.length - 1);
            }
            const i = v.lastIndexOf('/');
            if(i == -1) {
                const id = Number(v.substring(1, v.length));
                groupMap.set(id, { at: at })
            }
            else {
                const id = Number(v.substring(1, i));
                const subs = v.substring(i + 1, v.length).split(',');
                const subSet = new Set()
                subs.forEach((x) => subSet.add(Number(x)))
                groupMap.set(id, { at: at, sub: subSet })
            }
        }
    } catch (error) {
        console.error(
            [
                '解析失败',
                v,
                error
            ].join(' ')
        )
    }
});

console.log(privateSet);
console.log(groupMap);

console.log("Hello!");

/**
 * @type {qq.Config}
 */
var qqconfig = {
    platform: QQ_PLATFORM,
    data_dir: QQ_DATA_DIR,
};

var client = qq.createClient(qqconfig);


client.on('message.private', (e) => {
    if(allPrivate) pushMsg(e);
    else if(privateSet.has(e.sender.user_id)) pushMsg(e);
});

client.on('message.group', (e) => {
    if(allGroup) pushGroupMsg(e);
    else if(allGroupAt && (e.atall || e.atme)) pushGroupMsg(e);
    else if(groupMap.has(e.group_id)) {
        const group = groupMap.get(e.group_id)
        if(group.at) {
            if(!e.atall && !e.atme) return;
        }
        if(group.sub == undefined) pushGroupMsg(e);
        else if(group.sub.has(e.sender.user_id)) pushGroupMsg(e);
    }
})

/**
 * 
 * @param {MessageElem[]} msgs 
 */
function resolveMessage(msgs) {
    const text = [];
    const images = [];

    msgs.forEach((msg) => {
        switch (msg.type) {
            case 'image':
                images.push(msg.url);
                break;
            default:
                text.push(msg.text);
                break;
        }
    })
    return {
        text: text.join(' '),
        images
    }
}


/**
 * @param {qq.PrivateMessageEvent} e
 */
function pushMsg(e) {
    const sender = e.friend ? e.friend.remark : e.nickname;
    const { text, images } = resolveMessage(e.message);
    const msg = [
        '<b>',
        escapeHTML(sender),
        '</b>',
        '\n',
        escapeHTML(text)
    ].join('');
    push(msg, images);
}

/**
 * @param {qq.GroupMessageEvent} e
 */
function pushGroupMsg(e) {
    const group = e.group_name;
    const friend = client.pickFriend(e.sender.user_id);
    const sender = e.sender.card || friend?.remark || e.sender.nickname;
    const { text, images } = resolveMessage(e.message);
    const msg = [
        '<i>[',
        escapeHTML(group),
        ']</i>\n',
        '<b>',
        escapeHTML(sender),
        '</b>',
        '\n',
        escapeHTML(text)
    ].join('');
    push(msg, images);
}


/**
 * @param {string} text 
 */
async function push(text, images = [], retries = 0) {
    if(retries > 0) console.log('推送失败，重试第' + retries + '次');
    try {
        let body;
        if(images.length == 0) {
            body = {
                token: PUSH_TARGET,
                text: text,
                html: true,
                thread_id: THREAD_ID
            }
        }
        else if(images.length == 1) {
            body = {
                token: PUSH_TARGET,
                version: 2,
                method: 'sendPhoto',
                params: {
                    message_thread_id: THREAD_ID,
                    photo: images[0],
                    caption: text,
                    parse_mode: 'HTML'
                }
            }
        }
        else {
            const media = [];
            images.forEach((img) => {
                media.push({
                    type: 'image',
                    media: img,
                    captoin: text,
                    parse_mode: 'HTML'
                })
            })
            body = {
                token: PUSH_TARGET,
                version: 2,
                method: 'sendMediaGroup',
                params: {
                    message_thread_id: THREAD_ID,
                    media
                }
            }
        }
        console.log(JSON.stringify(body));
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            body: JSON.stringify(body)
        });
        if(res.ok) {
            console.log('推送成功');
        }
        else {
            console.error(res.statusText);
            if(retries < MAX_RETRIES) push(text, images, retries + 1);
        }
    } catch (error) {
        console.error(error);
        if(retries < MAX_RETRIES) push(text, images, retries + 1);
    }
}

/**
 * 
 * @param {string} text 
 * @returns string
 */
function escapeHTML(text) {
    return text.replace('<', '&lt;').replace('>', '&gt;').replace('&', '&quot;');
}

// 下面是登录相关

client.on('system.login.slider', (e) => {
    console.log('输入滑块地址获取的ticket后继续。\n滑块地址:    ' + e.url)
    process.stdin.once('data', (data) => {
        client.submitSlider(data.toString().trim())
    })
})
client.on('system.login.qrcode', (e) => {
    console.log('扫码完成后回车继续:    ')
    process.stdin.once('data', () => {
        client.login()
    })
})
client.on('system.login.device', (e) => {
    console.log('请选择验证方式:(1：短信验证   其他：扫码验证)')
    process.stdin.once('data', (data) => {
        if (data.toString().trim() === '1') {
            client.sendSmsCode()
            console.log('请输入手机收到的短信验证码:')
            process.stdin.once('data', (res) => {
                client.submitSmsCode(res.toString().trim())
            })
        } else {
            console.log('扫码完成后回车继续：' + e.url)
            process.stdin.once('data', () => {
                client.login()
            })
        }
    })
})

const account = Number(process.env.QQ_ACCOUNT);
const password = process.env.QQ_PASSWORD;
client.login(account, password);


// Ctrl+C

function exitHandler() {
    if(client.isOnline) {
        client.logout(false).then(() => {
            console.log('退出登录~');
            process.exit(0);
        })
        
    }
}

process.on('SIGINT', exitHandler)