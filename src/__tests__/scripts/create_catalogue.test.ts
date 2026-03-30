import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const {
  parseHorseResults,
  getLastPageNo,
  buildCatalogue,
} = require('../../../scripts/create_catalogue')

const SAMPLE_TABLE_HTML = `
<html><body>
<table class="race_table_01">
  <tr><th>No</th><th>馬名</th><th>性別</th><th>生年</th><th></th><th>厩舎</th><th>父</th><th>母</th></tr>
  <tr>
    <td>1</td>
    <td><a href="/horse/2024100001/">テストホース</a></td>
    <td>牡</td><td>2024</td><td></td><td></td>
    <td><a href="/horse/sire/123/">キタサンブラック</a></td>
    <td><a href="/horse/mare/456/">テスト牝馬</a></td>
  </tr>
  <tr>
    <td>2</td>
    <td><a href="/horse/2024100002/">セカンドホース</a></td>
    <td>牝</td><td>2024</td><td></td><td></td>
    <td><a href="/horse/sire/123/">キタサンブラック</a></td>
    <td><a href="/horse/mare/789/">別の牝馬</a></td>
  </tr>
  <tr>
    <td>3</td>
    <td><a href="/horse/2024100003/">サードホース</a></td>
    <td>牡</td><td>2024</td><td></td><td></td>
    <td><a href="/horse/sire/999/">エピファネイア</a></td>
    <td><a href="/horse/mare/111/">三番の母</a></td>
  </tr>
</table>
</body></html>
`

const SAMPLE_PAGER_HTML = `
<html><body>
<div class="common_pager">
  <a title="前">前</a>
  <a href="/?page=3" title="最後">最後</a>
</div>
</body></html>
`

const SAMPLE_SINGLE_PAGE_HTML = `
<html><body>
<div class="common_pager"></div>
</body></html>
`

describe('parseHorseResults', () => {
  it('ヘッダ行をスキップして馬データを返す', () => {
    const results = parseHorseResults(SAMPLE_TABLE_HTML)
    expect(results).toHaveLength(3)
  })

  it('列数が不足する行はスキップする', () => {
    const html = `
      <html><body>
      <table class="race_table_01">
        <tr><th>header</th></tr>
        <tr><td>1</td><td><a href="/horse/2024100001/">ホースA</a></td></tr>
      </table>
      </body></html>
    `
    const results = parseHorseResults(html)
    expect(results).toHaveLength(0)
  })

  it('IDを正しく抽出する', () => {
    const results = parseHorseResults(SAMPLE_TABLE_HTML)
    expect(results[0].id).toBe('2024100001')
    expect(results[1].id).toBe('2024100002')
  })

  it('馬名・父・母を正しく抽出する', () => {
    const results = parseHorseResults(SAMPLE_TABLE_HTML)
    expect(results[0].name).toBe('テストホース')
    expect(results[0].sire).toBe('キタサンブラック')
    expect(results[0].mare).toBe('テスト牝馬')
  })
})

describe('getLastPageNo', () => {
  it('最後ページリンクからページ数を返す', () => {
    expect(getLastPageNo(SAMPLE_PAGER_HTML)).toBe(3)
  })

  it('ページネーションがない場合は1を返す', () => {
    expect(getLastPageNo(SAMPLE_SINGLE_PAGE_HTML)).toBe(1)
  })
})

describe('buildCatalogue', () => {
  it('name/sire/mareが欠損している行をフィルタする', () => {
    const horses = [
      { id: '001', name: 'ホースA', sire: '父A', mare: '母A' },
      { id: '002', name: '', sire: '父B', mare: '母B' },
      { id: '003', name: 'ホースC', sire: '', mare: '母C' },
      { id: '004', name: 'ホースD', sire: '父D', mare: '' },
    ]
    const result = buildCatalogue(horses)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('001')
  })

  it('sire_countを正しく集計する', () => {
    const horses = [
      { id: '001', name: 'ホースA', sire: '父A', mare: '母A' },
      { id: '002', name: 'ホースB', sire: '父A', mare: '母B' },
      { id: '003', name: 'ホースC', sire: '父B', mare: '母C' },
    ]
    const result = buildCatalogue(horses) as { id: string; sire_count: number }[]
    const horseA = result.find((h) => h.id === '001')
    const horseC = result.find((h) => h.id === '003')
    expect(horseA?.sire_count).toBe(2)
    expect(horseC?.sire_count).toBe(1)
  })

  it('sire_count降順でソートされる', () => {
    const horses = [
      { id: '001', name: 'ホースA', sire: '父B', mare: '母A' },
      { id: '002', name: 'ホースB', sire: '父A', mare: '母B' },
      { id: '003', name: 'ホースC', sire: '父A', mare: '母C' },
    ]
    const result = buildCatalogue(horses)
    expect(result[0].sire).toBe('父A')
    expect(result[0].sire_count).toBe(2)
    expect(result[result.length - 1].sire_count).toBe(1)
  })

  it('出力フィールドはid/name/sire/mare/sire_countのみ', () => {
    const horses = [{ id: '001', name: 'ホースA', sire: '父A', mare: '母A' }]
    const result = buildCatalogue(horses)
    expect(Object.keys(result[0])).toEqual(['id', 'name', 'sire', 'mare', 'sire_count'])
  })
})
