import {
  BUNDLED_SKILL_RANK,
  type SkillCandidate,
  type SkillDefinition,
  type SkillProvider,
} from '@deepseek-ai/dsh-skill'

const PROVIDER_NAME = 'dsh-tieba-plugin'
const INVOCATION = { modelInvocable: true, userInvocable: true } as const

const CANDIDATES: SkillCandidate[] = [{
  name: 'tieba-briefing',
  description:
    '播报贴吧数据时使用：规定贴吧工具结果的汇报格式（先报吧名与帖数、'
    + '每条一行带原帖链接、只依据工具数据不编造、超长帖说明只取前 N 楼）。',
  invocation: INVOCATION,
  provider: PROVIDER_NAME,
  source: 'bundled',
  rank: BUNDLED_SKILL_RANK,
  locator: 'tieba-briefing',
}]

const BODY = `# 贴吧播报规范（tieba-briefing）

调用贴吧工具（tieba_forum_threads / tieba_thread_detail / tieba_thread_replies /
tieba_forum_search）拿到数据后，按本规范组织回复。

## 结构契约（按顺序）
1. **先报定位**：一句话说清「哪个吧 / 哪个帖子 / 搜索什么词」，以及拿到多少条。
2. **列表逐条一行**：每条 = \`[标题](原帖链接) · 作者 · N 回复\`。
   （匿名通道不提供发帖/最后回复时间，别写不存在的时间。）
3. **楼层正文**：按楼层顺序摘录，每楼标注楼层号与作者；长正文只摘关键句并说明「已截断」。
4. **结尾一句**：需要更深的楼中楼/下一页时，提示可以继续调 tieba_thread_replies 或翻 page。

## 必含要素
- 原帖链接必须给（用户要能点回原贴）：\`https://tieba.baidu.com/p/<tid>\`。
- 置顶帖要标注（工具返回 is_top）；精品标记匿名通道拿不到，不要臆造。
- 数据条数要说清（例：「共 27 帖」），不要让用户猜。

## 格式契约
- 中文回复；列表用 markdown 列表；一条帖子一行，不写成长段落。
- 有摘要就带上，没有就不写。

## 边界（不做什么）
- **只依据工具返回的数据**，不编造标题、作者、回复数、时间。
- 工具返回空/失败时，直接说失败原因（吧名写错 / 帖子被删 / 接口变化），不要用训练记忆填空。
- 超过工具上限的楼层必须明确说明「只取到前 N 楼，其余未读」。
- 不要整段复制楼层正文（版权），摘录关键句即可。
`

export const tiebaBriefingProvider: SkillProvider = {
  name: PROVIDER_NAME,
  list: () => Promise.resolve(CANDIDATES),
  async get(candidate: SkillCandidate): Promise<SkillDefinition> {
    return {
      name: candidate.name,
      description: candidate.description,
      invocation: candidate.invocation,
      provider: PROVIDER_NAME,
      source: 'bundled',
      content: BODY,
    }
  },
}
