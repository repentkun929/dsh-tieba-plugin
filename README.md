# dsh-tieba-plugin

贴吧 DSH 插件：让 agent 通过贴吧**匿名客户端接口**（`/c/*_pc` + sign）读取公开帖子信息。

> 读公开数据**不需要登录**。BDUSS 是可选配置，仅在需要扩大可见范围时填写。

给 DSH 装上之后，agent 就能查某个吧的帖子列表、读帖子楼层、看楼中楼回复、按关键词搜帖，
并在对话里渲染成贴吧卡片（Toolview）。

## 工具

| 工具 | 用途 | 关键参数 |
| --- | --- | --- |
| `tieba_forum_threads` | 吧内帖子列表 | `forum`（吧名，不带「吧」字，如「原神」）、`page`（默认 1）、`sort`=`default`/`new` |
| `tieba_thread_detail` | 帖子楼层 | `tid`（支持 `https://tieba.baidu.com/p/<tid>` 或纯数字） |
| `tieba_thread_replies` | 楼中楼回复 | `tid`、`pid`（楼层 id，来自 `tieba_thread_detail`） |
| `tieba_forum_search` | 搜索帖子 | `word`（关键词）、`forum`（可选，留空 = 全站） |

## 配置

插件配置由 profile/补丁层注入（`cordis` 的 `apply(ctx, config)` 第二参）：

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `bduss` | `''` | 可选。贴吧 BDUSS Cookie 值；读公开数据不需要，填了可扩大可见范围。1~2 周过期，建议用小号 |
| `userAgent` | 桌面 Chrome | `_pc` 通道对 UA 不敏感 |
| `timeoutMs` | `15000` | 单次请求超时 |
| `proxyUrl` | `''` | 可选 HTTP 代理（打不开 tieba.baidu.com 时用）。见下方说明 |
| `maxThreads` | `30` | 吧内列表单次上限（硬上限 50） |
| `maxFloors` | `30` | 楼层/楼中楼单次上限（硬上限 50 / 20） |
| `maxSearch` | `20` | 搜索单次上限（硬上限 30） |

> BDUSS 只从配置读，不硬编码、不回显日志。

### ⚠️ 必须重新导出 `Config`（否则插件静默失效）

`src/index.ts` 末尾的 `export { ConfigSchema as Config }` **不能删**。

cordis 的 `resolveConfig()`（`lib/index.js:956-962`）是：

```js
if (!runtime.Config) return config        // 没有 schema 就原样透传
return runtime.Config['~standard'].validate(config).value
```

而 `runtime.Config` 取自 `plugin.Config`（`lib/index.js:1631`）。我们的 `cordis.patch.yml`
insert 条目**没有 `config:` 字段**，所以透传进来的是 `undefined`；一旦产物不导出 `Config`，
`apply(ctx, undefined)` 里读 `config.bduss` 会抛 `TypeError` —— 异常发生在 `ctx.effect`
回调内，会被 cordis 吞掉，**四个工具一个都注册不上，且没有任何日志**。

症状：插件装了、文件在位、没有 `skipping profile bundle` 警告，但模型工具列表里没有 `tieba_*`。

防线有三层：`src/index.ts` 的 `normalizeConfig()` 兜底（即使 schema 没走到也不会拿到
`undefined`）、`tools/check_artifacts.mjs` 查产物 `export {...}` 里有 `Config`、
`test/contract.test.mjs` 的「插件装载契约」组用**真 cordis** 以 `config=undefined` 装载。

### proxyUrl 与 undici

`proxyUrl` 通过 undici 的 `ProxyAgent` 注入到 `fetch` 的 `dispatcher` 选项（`new ProxyAgent({ uri })`，
v7 起只接受对象）。undici **不是**本插件的依赖，而是运行时按需加载：

- 不配 `proxyUrl` → **永远不加载 undici**，走直连；
- 配了 `proxyUrl` → 动态 `import('undici')`，解析基准是**产物自身所在目录**，
  即插件安装位置的 `node_modules`（desktop profile 顶层有 `undici@7.30.0`，实测可用）；
- 配了但加载不到（如 web profile 没装 undici）→ 抛出可读中文错误，提示装 undici 或清空 `proxyUrl`，
  不会出现光秃秃的 `ERR_MODULE_NOT_FOUND`。

> 之所以动态加载：`ProxyAgent` 同步 import 会让产物硬依赖 undici，而各 profile 的可用性不一
> （desktop 有、web 没有），直连用户还会白白多一个依赖。

## 数据通道

四个工具走同一个 `signedGet`：参数确定后算一次 sign，之后不得再加键。

| 端点 | 用途 | 关键返回字段 |
| --- | --- | --- |
| `GET /c/f/frs/page_pc?kw=&pn=&sort_type=&sign=` | 吧内列表 | `page_data.feed_list[]`（`layout=feed` 普通帖 / `frs_top_thread_card` 置顶帖） |
| `GET /c/f/pb/page_pc?kz=&pn=&sign=` | 帖子楼层 | `first_floor` + `post_list[]`（14 楼/页，可翻页）、`thread`、`forum`、`user_list`、`page` |
| `GET /c/f/pb/page_pc?kz=&pn=&sign=` | 楼中楼 | 楼层内联在 `post_list[i].sub_post_list.sub_post_list[]` |
| `GET /c/s/searchpost?word=&pn=&rn=&kw=&sign=` | 搜索 | `post_list[]` + `page{page_size,total_count,has_more}` |

### sign 算法

```
sign = md5(参数按 key 的 codepoint 序拼成无分隔符 `k=v` 串 + "tiebaclient!!!")
```

两个必须遵守的点（否则一律 `error_code:110001`）：

1. **排序必须是 codepoint 序**。JS 的 `Array.prototype.sort()` 默认序即为 codepoint 序；
   PowerShell 的 `Sort-Object Name` 是 culture-aware 排序，用它算会得到完全不同的 md5。
2. **sign 必须在所有参数确定后算一次**，之后不得再往参数集里加键——加了就 110001。

### 已知限制（接口本身的行为，非插件缺陷）

- 楼层分页上限：`/c/f/pb/page_pc` 一页 14 楼；超长帖需要翻页，`tieba_thread_detail` 只取首页，
  单次返回上限由 `maxFloors`（默认 30）控制。
- 楼中楼不能单独翻页：匿名通道只有楼层内联的那一份（`/c/f/pb/nestedFloor` 要登录）。
  `tieba_thread_replies` 会按 `pid` 需要的那几页去请求（最多 20 页），再挑出对应楼层。
- 吧内排序只有 `default`（算法推荐，置顶在前）与 `new`（按发帖时间倒序）。
- `post_list` 的 `floor` 不连续：缺号是被折叠/删除的楼层（`fold_tip="查看本楼内容"`）。
- `user_list` 是数组，按 `id` 索引作者名——楼层本身只有 `author_id`，需要联表取名。
- 域名：实现用 `BASE = 'https://tieba.baidu.com'`；`c.tieba.baidu.com` 实测同样可用（`error_code:0`）。

## 开发

```powershell
pnpm install --config.strict-peer-dependencies=false
python scripts/link_deps.py      # 可选：把宿主的 @deepseek-ai/* junction 进来做同版本校验
npx tsdown                       # 双端打包
npm run typecheck                # 双 tsconfig 类型检查
npm test                         # 52 项测试（需 Node >= 22）
```

一次跑完：`powershell -ExecutionPolicy Bypass -File scripts/build.ps1`。

产物：`lib/index.mjs`（Node 端 ESM + `.d.mts`）、`lib/client.js`（浏览器端 CJS 单文件，已带 `window.__ModuleLoader__.load` 包装）。

> ⚠️ **产物必须导出 `Config`**（`export { Config, apply, inject, name }`）。少了它，
> `apply()` 拿到的 config 是 `undefined`，第一个 `ctx.effect` 就抛异常并被 cordis 静默吞掉，
> **四个工具一个都注册不上**。详见上方「必须重新导出 `Config`」。防线：
> `tools/check_artifacts.mjs` 查导出名、`tools/guard_config.mjs` 用真 cordis 装载验证、
> `test/contract.test.mjs` 的「插件装载契约」组。

> ⚠️ **`window.__ModuleLoader__.load({ id })` 的 `id` 必须等于 `package.json` 的 `name`。**
> 宿主 `@deepseek-ai/dsh-client-modules` 用包名建模块图（`reconcilePackage(packageName)` → `graphRow(packageName, …)`），
> 加载完靠 `factories.has(row.id)` 确认；id 不匹配时宿主只报一句
> `loaded without registering "dsh-tieba-plugin" via __ModuleLoader__.load`，
> **Node 端工具照常工作，而浏览器端卡片永久静默消失**（退化成通用文本行）。
> 所以 `tsdown.config.ts` 是从清单读 `id`（`id: PLUGIN_ID`，不硬编码），`tools/check_artifacts.mjs` 与
> `test/client-render.test.mjs` 都对此加了断言。Node 端的 `export const name` 则只是 Loader 条目的**展示名**
> （范本 `dsh-workbuddy-connect` 用 `'llm-workbuddy'`），允许与包名不同。

测试分两组：

| 文件 | 覆盖 |
| --- | --- |
| `test/contract.test.mjs` | 40 项：sign 算法、四端点解析、错误码归一化、`tiebaMetaFrom` 字段校验、proxyUrl 接线、**插件装载契约（真 cordis + 无 config）** |
| `test/client-render.test.mjs` | 12 项：**浏览器端产物离线渲染**——按宿主路径执行 `lib/client.js`、捕获 keyed 注册、把真实 `presentationMeta` 喂给组件后用 `react-dom/server` 渲染成 HTML |

渲染测试默认测源目录产物；加 `TIEBA_CLIENT_ARTIFACT=<profile 里的 client.js>` 可直接验证**已安装**的那一份。

Node 端产物只 import `@deepseek-ai/dsh-tools` 与 `@deepseek-ai/dsh-skill`；client 端只 require
`react/jsx-runtime`——两者都由宿主提供（平台 seed 表 / app-boot runtime resolution），
所以插件本身零运行时依赖。

## 安装

**从 GitHub 安装**（推荐，仓库根目录即为插件包）：

```powershell
dsh plugin --profile web add github:repentkun929/dsh-tieba-plugin
```

也可以直接给仓库 URL 或 tarball 地址（dsh 的 install-spec 支持 `github:` / `git:`
/ 仓库 HTTPS URL / `.tar.gz`）：

```powershell
dsh plugin --profile web add https://github.com/repentkun929/dsh-tieba-plugin
```

**从本地目录安装**（开发时用）：

```powershell
dsh plugin --profile web add file:<本插件目录的绝对路径>
```

装完重启 dsh 即可在对话里用贴吧工具。`--profile` 换成你的实际 profile；
desktop profile 由 Electron 应用独占管理（`dsh --profile desktop` 会被拒绝），
请在 GUI 的插件管理里安装，或直接改 profile 清单（见下）。

> **装完必须重启 dsh。** 宿主里没有 hmr bundle 时，新装的 bundle 不会热加载
> （`dsh-plugin-manager` 的 `reload()` 在 `hmr === undefined` 时是空操作）。

## 更新

从 GitHub 安装的，重新 `add` 一次即可：

```powershell
dsh plugin --profile web add github:repentkun929/dsh-tieba-plugin
```

本地 `file:` 安装是**复制**语义（pnpm 不会因为源目录改动而重装），改完源码要：

```powershell
npx tsdown                        # 重新打包
python scripts/sync_profile.py desktop   # 或 web；同步 lib/ 与清单到 profile
```

注意同步目标是 `<profile>/node_modules/dsh-tieba-plugin/`：产物进 `lib/`（`main`/`exports` 都指向 `lib/`），
清单 `package.json` / `cordis.patch.yml` / `README.md` / `LICENSE` 进插件根目录。

> **清单也必须同步**：`file:` 是复制语义，pnpm 不会因为源目录改动而重装，宿主读的又是 **profile 里那份**
> 清单（`readProfileManifest` / `resolveBundleDir` / `parseDshClient`）。曾出现 profile 里的 `package.json`
> 仍带着源目录早已删除的自造键 `dshx` —— 只同步 `lib/` 会让这类偏差永久潜伏。
> `sync_profile.py` 现已同时同步这些清单文件，且重复执行是幂等的（相同则打印 `[=]` 跳过）。

desktop profile 没有 hmr bundle，因此**新装或更新后需要重启 dsh 才生效**。

## 目录结构

```
.
├── src/
│   ├── index.ts            # 插件入口：导出 name / inject / Config / apply
│   ├── config.ts           # schemastery 配置 schema
│   ├── api.ts              # sign 计算 + 纯 JS md5 + 四个 _pc 端点
│   ├── fragment.ts         # presentationMeta 形状与浏览器端校验
│   ├── tool.ts             # 四个工具的 defineTool 定义
│   ├── skill.ts            # tieba-briefing 技能提供者
│   └── client/index.tsx    # 浏览器端 keyed Toolview
├── test/                   # 52 项测试（契约 40 + 浏览器端渲染 12）
├── scripts/                # 构建 / 依赖链接 / profile 同步
├── lib/                    # 构建产物（**已提交**，见 .gitignore 说明）
├── cordis.patch.yml        # bundle 挂载补丁
└── package.json
```

`lib/` 是**故意提交**的：dsh 从 git 安装时只读仓库根目录的 `package.json` 与其
`main`/`exports` 指向的文件，用户机器上不会跑构建。改完源码请
`npx tsdown` 重新打包并一起提交。

## 许可

[Apache-2.0](LICENSE)。
