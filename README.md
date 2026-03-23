# しろさとTT200 TT Analytics

[![Live Site](https://img.shields.io/badge/Live-shirosato--tt--2026.teraren.com-00d4ff?style=for-the-badge)](https://shirosato-tt-2026.teraren.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![ECharts](https://img.shields.io/badge/Apache_ECharts-e43961?logo=apache&logoColor=white)](https://echarts.apache.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Deploy](https://img.shields.io/badge/Coolify-deployed-6366f1?logo=docker&logoColor=white)](https://shirosato-tt-2026.teraren.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

> **第11回しろさとTT200（2026年3月22日・城里テストセンター）** の全372選手のリザルト・ラップタイムを徹底分析するBIダッシュボード。

## Features

### Dashboard (Macro Analysis)
- **KPIサマリー** - 参加者数、完走率、最速タイム、平均速度
- **タイム分布ヒストグラム** + **年代×性別 箱ひげ図**
- **TOP10テーブル + ラップ推移**
- **順位推移チャート** - 各ラップ時点での順位変動
- **ラップタイム ヒートマップ** - 選手×ラップの2Dヒートマップ
- **ペース配分散布図** - 前半vs後半の平均ラップ比較
- **総合パフォーマンスランキング** - タイム + 安定性 + 後半維持率
- **統計チャート** - 男女比、年代別、都道府県別

### Athlete Detail (Micro Analysis)
- **偏差値レーダーチャート** (5軸)
- **ペーシング分析** + **ウォーターフォール**
- **ラップ安定性** (CV, 標準偏差)
- **CdA推定ツール** (パワー・体重入力、URL共有可能)
- **ペース配分散布図** (自分の位置をハイライト)
- **AIコメント**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, SSG) |
| Language | TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| Charts | Apache ECharts |
| Theme | next-themes (Dark/Light) |
| Deploy | Coolify (Docker + nginx) |

## Quick Start

```bash
npm install
npm run dev        # Development server
npm run build      # Build static site + sitemap
npm test           # Run tests
```

## Environment Variables

| Variable | Description |
|----------|------------|
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager ID |

## Deploy

```bash
docker build -t shirosato-tt .
docker run -p 80:80 shirosato-tt
```

## Data Source

- [しろさとTT200 公式サイト](https://shirosato-tt.com/)

## Author

**[@ittriathlon](https://x.com/ittriathlon)** | [Blog](https://triathlon.teraren.com/) | [AI TRI+](https://ai-triathlon-result.teraren.com/)
