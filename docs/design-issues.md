# Web Interface Design Issues

Web Interface Guidelines に基づくレビュー結果（2026-03-28）。

---

## src/app/layout.tsx

```
layout.tsx:26 - [x] lang="en" → lang="ja"（コンテンツが日本語）
layout.tsx:26 - <meta name="theme-color"> 欠落（背景色と一致させる）
layout.tsx:27 - [x] スキップリンク欠落。スクリーンリーダーがナビをバイパスできない
               <a href="#main-content" className="sr-only focus:not-sr-only">メインコンテンツへ</a> を body 直下に追加
```

---

## src/app/(protected)/layout.tsx

```
layout.tsx:38 - [x] <main> に id="main-content" 欠落（スキップリンクの飛び先）
layout.tsx:38 - [x] sticky header に env(safe-area-inset-top) なし（ノッチ端末で AppBar が欠ける）
               → AppBar に pt-[env(safe-area-inset-top)] 追加
```

---

## src/app/(auth)/login/page.tsx

```
login/page.tsx:65 - [x] email Input: autocomplete="email" 欠落、spellCheck={false} 欠落
login/page.tsx:75 - [x] password Input: autocomplete="current-password" 欠落
login/page.tsx:84 - [x] rootError <p>: aria-live="polite" 欠落（非同期エラー、スクリーンリーダーに通知されない）
login/page.tsx:86 - [x] 'ログイン中...' → 'ログイン中…'（全角省略記号）
```

---

## src/app/(auth)/signup/page.tsx

```
signup/page.tsx:94  - [x] email Input: autocomplete="email" 欠落、spellCheck={false} 欠落
signup/page.tsx:107 - [x] password Input: autocomplete="new-password" 欠落
signup/page.tsx:120 - [x] confirmPassword Input: autocomplete="new-password" 欠落
signup/page.tsx:126 - [x] rootError <p>: aria-live="polite" 欠落
signup/page.tsx:128 - [x] '登録中...' → '登録中…'
```

---

## src/app/(auth)/forgot-password/page.tsx

```
forgot-password/page.tsx:78 - [x] email Input: autocomplete="email" 欠落、spellCheck={false} 欠落
forgot-password/page.tsx:84 - [x] rootError <p>: aria-live="polite" 欠落
forgot-password/page.tsx:86 - [x] '送信中...' → '送信中…'
```

---

## src/app/(auth)/reset-password/page.tsx

```
reset-password/page.tsx:61 - [x] password Input: autocomplete="new-password" 欠落
reset-password/page.tsx:73 - [x] confirmPassword Input: autocomplete="new-password" 欠落
reset-password/page.tsx:80 - [x] rootError <p>: aria-live="polite" 欠落
reset-password/page.tsx:82 - [x] '更新中...' → '更新中…'
```

---

## src/app/(protected)/download/page.tsx

```
download/page.tsx:19 - [x] '読み込み中...' → '読み込み中…'、aria-live="polite" 欠落（または role="status"）
```

---

## src/components/ui/button.tsx

```
button.tsx:9 - [x] transition-all → 個別プロパティ列挙（例: transition-[colors,shadow]）
              transition: all はコンポジターに非効率、全プロパティをアニメーション対象にする
```

---

## src/components/layout/AppBar.tsx

```
AppBar.tsx:33 - [x] sticky header に safe-area-inset 対応なし（ノッチ端末）
AppBar.tsx:39 - APP_TITLE リンクに focus-visible スタイル明示なし（global outline-ring/50 頼り、視認性が低い場合あり）
AppBar.tsx:42 - <nav> に aria-label 欠落（例: aria-label="メインナビゲーション"）
```

---

## src/components/home/HorseSearchInput.tsx

```
HorseSearchInput.tsx:80 - [x] placeholder="母馬名で検索..." → "母馬名で検索…"
HorseSearchInput.tsx:78 - Command コンポーネント全体に role="combobox" 相当の ARIA が整備されているか確認
                          （shadcn/cmdk が担保しているが、disabled 時に aria-disabled も確認）
```

---

## src/components/home/OwnerList.tsx

```
OwnerList.tsx:13 - [x] '読み込み中...' → '読み込み中…'、role="status" 欠落
OwnerList.tsx:29 - owner.name がリンクテキストだが truncate なし → 超長名でレイアウト崩れ
                  → Link に truncate min-w-0 を追加
```

---

## src/components/home/HorseRegisterDialog.tsx

```
HorseRegisterDialog.tsx:200-203 - [x] root error <p>: aria-live="polite" 欠落
HorseRegisterDialog.tsx:210     - [x] '登録中...' → '登録中…'
HorseRegisterDialog.tsx:189     - RadioGroup の各行 <div className="flex items-center gap-2">
                                  → radio と label の間にデッドゾーンあり
                                  → <Label> で RadioGroupItem ごとラップするか label に cursor-pointer 追加
```

---

## src/components/group/OwnerFormDialog.tsx

```
OwnerFormDialog.tsx:97  - name Input: autocomplete="off" 欠落（パスワードマネージャーの誤トリガー防止）
OwnerFormDialog.tsx:110 - number Input: inputmode="numeric" 欠落（モバイルで数字キーが出ない）
OwnerFormDialog.tsx:127 - [x] root error <p>: aria-live="polite" 欠落
```

---

## src/components/group/OwnerDeleteDialog.tsx

```
OwnerDeleteDialog.tsx:61 - [x] error <p>: aria-live="polite" 欠落
```

---

## src/components/group/OwnerTable.tsx

```
OwnerTable.tsx:52-67 - [x] Pencil / Trash2 アイコンに aria-hidden="true" 欠落
                       親ボタンに aria-label があるため二重読み上げになる可能性
                       → <Pencil aria-hidden="true" /> に修正
```

---

## src/components/horselist/HorseTable.tsx

```
HorseTable.tsx:64  - [x] placeholder="馬名・父・母で検索" → "馬名・父・母で検索…"
HorseTable.tsx:27-28 - query・page が useState → URL 非同期；ページリロードや共有でリセットされる
                       nuqs 等でクエリパラメータ同期を検討（filter=xxx&page=2）
HorseTable.tsx:93-96 - TableCell で horse.name / sire / mare に truncate なし → 長名でセル溢れ
                       → <TableCell className="max-w-xs truncate"> など
HorseTable.tsx:100,108 - [x] Pencil / Trash2 に aria-hidden="true" 欠落（OwnerTable と同様）
HorseTable.tsx:57,60   - 頭数の数値表示に font-variant-numeric: tabular-nums 欠落
                         （数値列の桁揃えに使用すべき）
```

---

## src/components/horselist/HorseEditDialog.tsx

```
HorseEditDialog.tsx:182 - [x] root error <p>: aria-live="polite" 欠落
```

---

## src/components/horselist/HorseDeleteDialog.tsx

```
HorseDeleteDialog.tsx:59 - [x] error <p>: aria-live="polite" 欠落
```

---

## src/components/download/CsvDownloadButton.tsx

```
✓ pass
```

---

## src/components/home/ConflictAlertDialog.tsx

```
✓ pass
```

---

## 優先度まとめ

| 優先度 | 問題 | 対象ファイル数 |
|---|---|---|
| **高** ✅ | `autocomplete` 欠落（auth フォーム） | login, signup, forgot-password, reset-password |
| **高** ✅ | `aria-live="polite"` 欠落（全非同期エラー表示） | 7ファイル |
| **高** ✅ | `lang="en"` → `lang="ja"` | layout.tsx |
| **中** ✅ | `...` → `…`（ローディング・プレースホルダー） | 6ファイル |
| **中** ✅ | `transition-all` → 個別プロパティ | button.tsx |
| **中** ✅ | スキップリンク欠落 | layout.tsx, protected/layout.tsx |
| **中** ✅ | アイコンに `aria-hidden="true"` 欠落 | OwnerTable, HorseTable |
| **低** | テーブルセルの `truncate` 欠落 | HorseTable |
| **低** | `query`/`page` の URL 同期 | HorseTable |
| **低** | `inputmode="numeric"` 欠落 | OwnerFormDialog |
