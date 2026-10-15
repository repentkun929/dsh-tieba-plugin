import type { Context } from '@deepseek-ai/cordis'
import { type Config, Config as ConfigSchema } from './config.ts'
import { tiebaTools } from './tool.ts'
import { tiebaBriefingProvider } from './skill.ts'

export const name = 'dsh-tieba-plugin'
export const inject = ['tools', 'skills', 'systemPrompt']

/**
 * 必须重新导出配置 schema —— cordis 靠它给 apply() 注入默认值。
 *
 * cordis 的 resolveConfig()（lib/index.js:956-962）是：
 *   if (!runtime.Config) return config        // 没有 schema 就原样透传
 *   return runtime.Config['~standard'].validate(config).value
 * 而 runtime.Config 取自 `plugin.Config`（lib/index.js:1631）。
 *
 * 我们的 cordis.patch.yml 条目没有 `config:` 字段，所以透传进来的是 undefined；
 * 若不导出 Config，apply(ctx, undefined) 会在读 config.bduss 时抛
 * TypeError，整个插件的四个工具一个都注册不上（症状是「插件装了、文件在位、
 * 也没有 skip 警告，但模型工具列表里没有 tieba_*」）。
 *
 * 导出后 schemastery 会把 undefined / null / {} 都规范成带默认值的完整对象。
 */
export { ConfigSchema as Config }

const PROMPT = `## Query tieba (tieba)
用户询问贴吧内容时，使用贴吧工具族（读公开数据，匿名即可，不需要登录）：
- \`tieba_forum_threads\`：某个吧的帖子列表（forum 不带「吧」字，如「原神」）。
- \`tieba_thread_detail\`：一个帖子的楼层；用户给的是 \`https://tieba.baidu.com/p/<tid>\` 链接时，
  直接把链接填进 tid 参数。每页约 15 楼，长帖要传 page 翻页；想知道楼主说了什么时传
  onlyLz=true 只看楼主。
- \`tieba_thread_replies\`：楼层下的楼中楼回复，需要 tid + pid（pid 来自 tieba_thread_detail）。
- \`tieba_forum_search\`：按关键词搜帖子，可用 forum 限定吧；可用 page 翻页，标了「楼层」的结果
  是某帖里的某一层回复，链接精确到那一楼。
拿到数据后按 tieba-briefing 技能规范播报。接口每页固定条数、楼层/楼中楼有上限，
汇报时如实说明只取到前 N 楼。`

/**
 * 兜底：即使 cordis 没走到 schema（例如宿主行为变化、或有人直接调 apply），
 * 也不能让 config 是 undefined —— 否则 `config.bduss` 会抛进 ctx.effect 里，
 * 被 cordis 静默吞掉，表现为「工具全没了但没有任何报错」。
 */
function normalizeConfig(config: unknown): Config {
  // schemastery 的 validate 是同步的（cordis 也一样：遇到 Promise 会抛
  // "Async config validation is not supported"），但标准类型签名允许 Promise。
  const result = ConfigSchema['~standard'].validate(config ?? {}) as
    | { value: Config }
    | { issues: unknown }
  if ('issues' in result) throw new Error(`tieba 插件配置无效：${JSON.stringify(result.issues)}`)
  return result.value
}

export function apply(ctx: Context, rawConfig: Config) {
  const config = normalizeConfig(rawConfig)

  ctx.effect(() => {
    const disposers = tiebaTools(config).map((tool) => ctx.tools.register(tool))
    return () => disposers.forEach((d) => d())
  }, 'dsh-tieba-plugin.tools')

  ctx.effect(() => ctx.skills.registerProvider(() => tiebaBriefingProvider), 'dsh-tieba-plugin.skill')

  ctx.effect(() => ctx.systemPrompt.section({
    name: 'tool:tieba',
    order: 117,
    text: PROMPT,
  }), 'dsh-tieba-plugin.prompt')
}
