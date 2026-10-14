import Schema from '@deepseek-ai/schemastery'

const z = Schema

/** 插件配置：用户可在 profile/补丁层覆盖，无需改代码。 */
export const Config = z.object({
  /** 可选登录态：Cookie 里的 BDUSS 值（小号，1~2 周过期）。空 = 匿名访问（读公开数据不需要）。 */
  bduss: z.string().role('secret').default('').description(
    '贴吧 BDUSS（Cookie 值），可选。公开帖子/吧/搜索匿名即可读取；填了能扩大可见范围。'),
  /** UA：匿名 _pc 通道对 UA 不敏感，这里留桌面 Chrome。 */
  userAgent: z.string().default(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
    + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  ).description('User-Agent'),
  /** 单次请求超时。 */
  timeoutMs: z.number().default(15000).description('单次请求超时（毫秒）'),
  /** 可选 HTTP 代理（打不开 tieba.baidu.com 时用）。空 = 直连。 */
  proxyUrl: z.string().default('').description('HTTP 代理地址，如 http://127.0.0.1:7890；空 = 直连'),
  /** 吧内列表单页上限。 */
  maxThreads: z.number().default(30).description('吧内列表单次最多返回条数'),
  /** 帖子详情单页楼层上限。 */
  maxFloors: z.number().default(30).description('帖子详情单次最多返回楼层数'),
  /** 搜索单次上限。 */
  maxSearch: z.number().default(20).description('搜索单次最多返回条数'),
})

export type Config = ReturnType<typeof Config>
