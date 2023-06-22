# QQ消息转发

通过 [NekoPush](https://github.com/MeowBot233/NekoPush) 将特定QQ消息推送到Telegram的小工具。

~~随便搓的小工具代码混乱点怎么了uwu~~
~~反正这种工具不是能跑就行😋~~

## 运行

### 获取ChatID

你需要首先获取Telegram ChatID。
- **推荐** 使用 NekoPush官方实例 [@neko_push_bot](https://t.me/neko_push_bot)。 对Bot使用 `/chat_id` 来获取你的ChatID。
- 或者你也可以自行部署自己的 NekoPush 服务端，使用自己的Bot来进行推送。部署教程见 [NekoPush README](https://github.com/MeowBot233/NekoPush/blob/main/README.md)。自行部署请记得修改 `.env` 中的 `API_URL`。

### 运行本项目

1. 安装 [NodeJS](https://nodejs.org) 环境。
2. 克隆或下载本项目。
3. 复制一份 `.env.example` 文件，命名为 `.env` 文件。
4. 按照 `.env` 文件中的说明填写。
5. 在终端运行一次 `npm install` 来安装依赖。*大陆用户可以在本行末尾加入 `--registry=https://registry.npmmirror.com` 使用镜像加快安装速度。**请不要丢失空格！***
6. 运行 `npm run start`

*或者，Windows用户可以直接双击本目录下的`start.bat`文件。*

## 配置

配置说明参考 [.env.example](./.env.example)。
除了使用 `.env` 文件，你也可以将配置的值存放在环境变量中。
