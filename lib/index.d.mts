import { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

//#region src/config.d.ts
/** 插件配置：用户可在 profile/补丁层覆盖，无需改代码。 */
declare const Config: Schema<Schemastery.ObjectS<NoInfer<{
  /** 可选登录态：Cookie 里的 BDUSS 值（小号，1~2 周过期）。空 = 匿名访问（读公开数据不需要）。 */
  bduss: Schema<string, string, "defined">;
  /** UA：匿名 _pc 通道对 UA 不敏感，这里留桌面 Chrome。 */
  userAgent: Schema<string, string, "defined">;
  /** 单次请求超时。 */
  timeoutMs: Schema<number, number, "defined">;
  /** 可选 HTTP 代理（打不开 tieba.baidu.com 时用）。空 = 直连。 */
  proxyUrl: Schema<string, string, "defined">;
  /** 吧内列表单页上限。 */
  maxThreads: Schema<number, number, "defined">;
  /** 帖子详情单页楼层上限。 */
  maxFloors: Schema<number, number, "defined">;
  /** 搜索单次上限。 */
  maxSearch: Schema<number, number, "defined">;
}>>, Schemastery.ObjectT<NoInfer<{
  /** 可选登录态：Cookie 里的 BDUSS 值（小号，1~2 周过期）。空 = 匿名访问（读公开数据不需要）。 */
  bduss: Schema<string, string, "defined">;
  /** UA：匿名 _pc 通道对 UA 不敏感，这里留桌面 Chrome。 */
  userAgent: Schema<string, string, "defined">;
  /** 单次请求超时。 */
  timeoutMs: Schema<number, number, "defined">;
  /** 可选 HTTP 代理（打不开 tieba.baidu.com 时用）。空 = 直连。 */
  proxyUrl: Schema<string, string, "defined">;
  /** 吧内列表单页上限。 */
  maxThreads: Schema<number, number, "defined">;
  /** 帖子详情单页楼层上限。 */
  maxFloors: Schema<number, number, "defined">;
  /** 搜索单次上限。 */
  maxSearch: Schema<number, number, "defined">;
}>>, "plain">;
type Config = ReturnType<typeof Config>;
//#endregion
//#region src/index.d.ts
declare const name = "dsh-tieba-plugin";
declare const inject: string[];
declare function apply(ctx: Context, rawConfig: Config): void;
//#endregion
export { Config, apply, inject, name };