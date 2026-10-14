# dsh 插件双端构建：install -> link_deps -> tsdown -> 自检
# 用法: powershell -ExecutionPolicy Bypass -File scripts/build.ps1
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$pnpm = $null
foreach ($cand in @($env:PNPM_EXE, (Get-Command pnpm -ErrorAction SilentlyContinue).Source)) {
  if ($cand -and (Test-Path $cand)) { $pnpm = $cand; break }
}
if (-not $pnpm) { throw 'pnpm not found — install pnpm or set $env:PNPM_EXE' }

Write-Host '[1/4] install'
# pnpm 不认 --legacy-peer-deps（npm 专有）；用 --config.strict-peer-dependencies=false
& $pnpm install --config.strict-peer-dependencies=false
if ($LASTEXITCODE -ne 0) { throw 'install failed' }

Write-Host '[2/4] link host deps (junction)'
& python scripts/link_deps.py
if ($LASTEXITCODE -ne 0) { throw 'link_deps failed' }

Write-Host '[3/4] tsdown (node + client)'
& npx tsdown
if ($LASTEXITCODE -ne 0) { throw 'tsdown failed' }

Write-Host '[4/4] verify artifacts'
$artifacts = 'lib/index.mjs', 'lib/index.d.mts', 'lib/client.js'
foreach ($f in $artifacts) {
  $p = Join-Path $root $f
  if (-not (Test-Path $p)) { throw "missing artifact: $f" }
}

# ---- 浏览器产物硬约束 ----
$client = Get-Content (Join-Path $root 'lib/client.js') -Raw
if ($client -notmatch 'window\.__ModuleLoader__\.load') { throw 'client.js missing ModuleLoader wrapper' }
if ($client -match '\bimport\s*\(') { throw 'client.js has dynamic import' }
$builtins = 'fs', 'path', 'os', 'http', 'https', 'crypto', 'net', 'tls', 'stream', 'url', 'zlib', 'child_process'
foreach ($m in $builtins) {
  $re = 'require.*' + $m
  if ($client -match $re) { throw "client.js references Node builtin: $m" }
}
$libDir = Join-Path $root 'lib'
$chunks = Get-ChildItem -Path $libDir -Filter 'client-*.js' -File
if ($chunks.Count -gt 0) { throw 'client bundle was split' }
$reactRe = 'react.createElement|React.createElement'
if ($client -match $reactRe) { throw 'react got bundled into client.js' }

# ---- Node 产物自检 ----
$node = Get-Content (Join-Path $root 'lib/index.mjs') -Raw
$needles = 'function calcSign', 'function md5Hex', '/c/f/frs/page_pc', '/c/f/pb/page_pc', '/c/s/searchpost'
foreach ($needle in $needles) {
  if ($node -notmatch [regex]::Escape($needle)) { throw "index.mjs missing: $needle" }
}
$cryptoRe = 'require\s*\(\s*["'']node:crypto|from\s+["'']node:crypto'
if ($node -match $cryptoRe) { throw 'index.mjs should not depend on node:crypto' }

Write-Host 'build ok'
