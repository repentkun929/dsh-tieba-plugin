#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把构建产物与插件清单同步到已安装的 profile（file: 依赖是复制，pnpm 不感知更新）。

用法: python scripts/sync_profile.py [profile]
默认 profile = web。

同步两类文件，落到 <dsh-data>/profiles/<profile>/node_modules/<包名>/ 下：
  1. 产物 -> 该目录的 lib/（package.json 的 main / exports 都指向 lib/，
     同步必须落到 lib/ 下才生效，写进插件根目录既不生效还会留孤儿文件）；
  2. 清单 -> 插件根目录的 package.json / cordis.patch.yml / README.md。

为什么清单也要同步：`file:` 依赖是复制语义，pnpm 不会因为源目录改动而重装。
只同步 lib/ 会让清单永久停在首次安装的那一份——例如曾出现 profile 里的
package.json 仍带着已删除的自造键 `dshx`，以及 exports / dsh.client 的后续改动
根本到不了已安装副本。宿主读的正是 profile 里那份清单（readProfileManifest /
resolveBundleDir / parseDshClient），所以它必须跟着源目录走。
"""
import argparse
import os
import shutil
import sys

# 插件根目录下需要跟随源目录更新的清单文件
MANIFEST_FILES = ('package.json', 'cordis.patch.yml', 'README.md', 'LICENSE')
# lib/ 下的构建产物
ARTIFACTS = ('index.mjs', 'index.d.mts', 'client.js')


def default_dsh_data() -> str | None:
    """DSH 数据目录：优先 $DSH_HOME，其次 $DSH_PROFILE_DIR 的祖父目录。"""
    env = os.environ.get('DSH_HOME')
    if env and os.path.isdir(env):
        return env
    # 在 dsh 会话里跑时 DSH_PROFILE_DIR=<dsh-data>\profiles\<profile>
    profile_dir = os.environ.get('DSH_PROFILE_DIR')
    if profile_dir:
        guess = os.path.dirname(os.path.dirname(profile_dir))
        if os.path.isdir(guess):
            return guess
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('profile', nargs='?', default='web')
    ap.add_argument('--dsh-data', default=default_dsh_data(),
                    help='dsh 数据目录；默认取 $DSH_HOME，其次由 $DSH_PROFILE_DIR 推导')
    args = ap.parse_args()

    if not args.dsh_data:
        print('[sync] ERROR: 找不到 dsh 数据目录。请设 $DSH_HOME 或显式传 --dsh-data <路径>',
              file=sys.stderr)
        return 1

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pkg_name = 'dsh-tieba-plugin'
    pkg_dir = os.path.join(args.dsh_data, 'profiles', args.profile,
                           'node_modules', *pkg_name.split('/'))
    # 产物在 lib/ 下（package.json 的 main / exports 都指向 lib/），必须同步到 pkg_dir/lib，
    # 否则写进插件根目录：既不生效，还会留下 main 之外的孤儿文件。
    dst = os.path.join(pkg_dir, 'lib')
    src = os.path.join(root, 'lib')

    if not os.path.isdir(src):
        print('[sync] ERROR: lib/ 不存在，先跑 build.ps1', file=sys.stderr)
        return 1
    if not os.path.isdir(pkg_dir):
        print(f'[sync] WARN: {pkg_dir} 不存在（插件未安装？），跳过', file=sys.stderr)
        return 0
    os.makedirs(dst, exist_ok=True)

    # 清掉历史误写位置留下的孤儿产物
    for name in ARTIFACTS:
        stray = os.path.join(pkg_dir, name)
        if os.path.isfile(stray):
            os.remove(stray)
            print(f'  [rm] stray {name} (was written to package root)')

    for name in ARTIFACTS:
        s = os.path.join(src, name)
        if os.path.exists(s):
            shutil.copy2(s, os.path.join(dst, name))
            print(f'  [ok] lib/{name}')
    # sourcemap 一起同步
    for name in os.listdir(src):
        if name.endswith(('.js.map', '.mjs.map')):
            shutil.copy2(os.path.join(src, name), os.path.join(dst, name))

    # 清单文件同步到插件根目录（宿主读的是 profile 里那份）
    for name in MANIFEST_FILES:
        s = os.path.join(root, name)
        if not os.path.exists(s):
            continue
        d = os.path.join(pkg_dir, name)
        if os.path.exists(d) and open(s, 'rb').read() == open(d, 'rb').read():
            print(f'  [=] {name} (already current)')
            continue
        shutil.copy2(s, d)
        print(f'  [ok] {name}')

    print(f'[sync] synced -> {pkg_dir}')
    return 0

if __name__ == '__main__':
    sys.exit(main())
