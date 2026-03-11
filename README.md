# 位置情報探索アプリ

地図上でスポットを検索・表示できるフルスタック Web アプリケーションです。
地図を動かすだけで周辺スポットの一覧と現在地の住所がリアルタイムに更新されます。

---

## 環境構築

### 必要なもの

- Docker / Docker Compose

### 手順

1. リポジトリをクローンする

```bash
git clone https://github.com/s3s7/location_information.git
cd location_information
```

2. 環境変数ファイルを作成する

```bash
cp .env.example .env
```

3. `.env` を編集する

```env
POSTGRES_DB=location_information
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Google Maps API キー（地図表示・住所取得の両方に使用）
# Google Cloud Console で Maps JavaScript API と Geocoding API を有効化してください
# 未設定の場合、住所は「緯度 X, 経度 Y」形式にフォールバック
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

---

## 実行手順

```bash
docker-compose up
```

このコマンド 1 つで以下がすべて自動実行されます。

| ステップ | 内容 |
|---------|------|
| DB 起動 | PostgreSQL + PostGIS コンテナを起動 |
| マイグレーション | テーブル・インデックスを作成 |
| シードデータ投入 | CSV 約 500 件を `spots` テーブルにインポート |
| API 起動 | NestJS サーバーを `http://localhost:3001` で起動 |
| Web 起動 | Next.js を `http://localhost:3000` で起動 |

ブラウザで `http://localhost:3000` を開くとアプリが使えます。

---

## 使用した主要ライブラリとその選定理由

### Frontend

| ライブラリ | バージョン | 選定理由 |
|-----------|-----------|---------|
| Next.js | 15.5.12 | 指定技術スタック。App Router によるシンプルな構成 |
| React | 19.2.3 | Next.js 15 に対応した最新の安定版 |
| @googlemaps/js-api-loader | 1.16.10 | 地図表示・マーカー・半径サークル描画に使用。日本の地図データの精度が高く、住所表示との一貫性を保てる。 |
| Tailwind CSS | 4.2.1 | 指定技術スタック。ユーティリティクラスで素早く UI を構築できる |
| TypeScript | 5.9.3 | 指定技術スタック。 |

### Backend

| ライブラリ / サービス | バージョン | 選定理由 |
|-----------|-----------|---------|
| NestJS | 11.1.16 | 指定技術スタック。モジュール構成で関心を分離しやすい |
| TypeORM | 0.3.28 | 指定技術スタック 公式ドキュメントはわかりやすく、ボリュームもそこまでないので学習コストは低め.リレーショナルDBサポート。Entityから差分を自動検知するDB migrationの仕組み。SQLのQueryBuilderやTransactionの仕組みも提供。|
| csv-parse | 6.1.0 | シードデータの CSV パースに使用。sync API でシンプルに実装できる |
| Google Maps Geocoding API | - | 逆ジオコーディング（座標 → 住所変換）に使用。日本語住所の精度が高く、`language=ja` パラメータで日本語表記の住所を取得できる。APIキー未設定時は「緯度 X, 経度 Y」のフォールバック表示に切り替わるため、キーなしでも動作確認が可能 |

### Infrastructure

| 技術 | 選定理由 |
|------|---------|
| PostgreSQL 16 + PostGIS 3.4 | `ST_DWithin` による半径検索と GiST インデックスで地理空間クエリを高速化できる |
| Docker Compose | 指定技術スタック |

---

## 実装時に特に工夫した点、および技術的な判断を行った箇所

### 1. 地図操作イベントの役割分離（center_changed / idle）

住所表示とスポット検索で意図的にトリガーを分けています。

```
center_changed → currentCenter 更新 → 住所取得をスロットル実行（500ms に 1 回）
idle           → searchCenter 更新  → スポット検索を実行（移動完了後のみ）
```

- 住所はドラッグ中も 500ms ごとに更新し、止まった後も末尾で必ず 1 回取得します。
- スポット検索は `idle` のみトリガーし、ドラッグ中の連続リクエストを防いでいます。

### 2. 逆ジオコーディングのスロットル + バックエンドキャッシュ

住所取得は以下の 2 段階で API コストと頻度を抑制しています。

**フロントエンド側：500ms スロットル**
`map.on("move")` は 60fps で発火しますが、500ms に 1 回だけ API を呼ぶスロットルを実装しています。移動が止まった後も末尾呼び出しで最終位置の住所を必ず取得します。

**バックエンド側：DB キャッシュ（`reverse_geocode_cache` テーブル）**
座標を小数 4 桁（約 11m 精度）に丸めてキャッシュキーとし、同じ地点は Google Maps API を呼ばずにキャッシュから即返します。キャッシュミス時のみ外部 API を呼び出し、結果を UPSERT で保存します。

### 3. PostGIS による地理空間検索

半径検索には `ST_DWithin` + GiST インデックスを採用しました。アプリケーション層で距離計算するのではなく、DB に計算を委譲することで大量データでも高速に動作します。`ST_Distance` で各スポットまでの距離もあわせて取得し、フロントの一覧表示に活用しています。

```sql
SELECT *, ST_Distance(location, center::geography) AS "distanceMeters"
FROM spots
WHERE ST_DWithin(location, center::geography, radiusKm * 1000)
ORDER BY "distanceMeters" ASC
LIMIT 200
```

### 4. `raw JSONB` カラムによる元データ保全

CSV の全フィールド（`category` 等、専用カラムを持たないものも含む）を `raw JSONB` に丸ごと保存しています。現時点では API から返していませんが、後からカラム追加なしに `raw->>'category'` でクエリできる拡張性を持たせています。

### 5. APIキー未設定時のフォールバック

`GEOCODING_API_KEY` が未設定の場合、住所の代わりに「緯度 X, 経度 Y」を返すフォールバックを実装しています。API キーなしでも全機能が動作確認できる状態を維持しています。

### 6. スポット検索の距離閾値チェック

`moveend` イベントで前回の検索座標との距離を Haversine 式で計算し、**200m 未満の移動であればスポット検索 API の呼び出しをスキップ**します。わずかな地図操作のたびに不要なリクエストが発生するのを防ぎ、バックエンドへの負荷とコストを抑制しています。

### 7. docker-compose up 1 コマンドで完結する起動フロー

`api` サービスの `command` にマイグレーション・シード・開発サーバー起動を直列で記述し、`depends_on: condition: service_healthy` で DB の準備完了を待ってから実行します。
初期状態から操作できる状態を 1 コマンドで実現しています。

---

## 時間が足りず実装を簡略化した箇所や、今後の改善点

### 実装を簡略化した箇所

- **地図マーカークリック時のポップアップ**
  マーカークリック時のポップアップ（スポット名・住所表示）は未実装です。

- **スポット一覧とマーカーの双方向連動未実装**
  一覧のスポットをクリックして地図のマーカーをハイライトする、あるいはマーカークリックで一覧をスクロールする連動は未実装です。

### 今後の改善点

- **スポットのカテゴリフィルタ**
  `raw JSONB` に `category` が保存されているため、カテゴリ絞り込みを UI に追加できます。

- **ページネーション**
  現在は `LIMIT 200` で件数を打ち切っています。スクロール読み込みやページネーションで全件を閲覧できるようにすることが望ましいです。
