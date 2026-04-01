#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const iconv = require('iconv-lite')
const cheerio = require('cheerio')
const ora = require('ora')
const chalk = require('chalk')

const BASE_URL = 'https://db.netkeiba.com'
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'

async function fetchHtml(params) {
  const url = new URL(BASE_URL)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  const res = await fetch(url.toString(), {
    headers: { 'user-agent': USER_AGENT },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${url.toString()}`)
  }
  const buffer = await res.arrayBuffer()
  return iconv.decode(Buffer.from(buffer), 'EUC-JP')
}

function getLastPageNo(html) {
  const $ = cheerio.load(html)
  const link = $('div.common_pager a[title="最後"]').first()
  if (!link.length) return 1
  const href = link.attr('href') || ''
  const match = href.match(/page=(\d+)/)
  return match ? parseInt(match[1], 10) : 1
}

function parseHorseResults(html) {
  const $ = cheerio.load(html)
  const results = []
  $('table.race_table_01 tr')
    .slice(1)
    .each((_i, row) => {
      const tds = $(row).find('td')
      if (tds.length < 8) return
      const nameCell = tds.eq(1)
      const name = nameCell.text().trim()
      const horseHref = nameCell.find('a').attr('href') || ''
      const id = horseHref.replace('/horse/', '').replace(/\/$/, '')
      const sire = tds.eq(6).find('a').first().text().trim()
      const mare = tds.eq(7).find('a').first().text().trim()
      results.push({ id, name, sire, mare })
    })
  return results
}

function buildCatalogue(horses) {
  // Filter rows where name, sire, and mare are all present
  const valid = horses.filter((h) => {
    const ok = h.name && h.sire && h.mare
    if (!ok) {
      if (!h.name) console.warn(chalk.yellow(`\u26a0  Missing name: ${h.id}`))
      if (!h.sire) console.warn(chalk.yellow(`\u26a0  Missing sire: ${h.id}`))
      if (!h.mare) console.warn(chalk.yellow(`\u26a0  Missing mare: ${h.id}`))
    }
    return ok
  })

  // Count sire occurrences among valid (catalogue-listed) horses
  const sireCounts = {}
  for (const h of valid) {
    sireCounts[h.sire] = (sireCounts[h.sire] || 0) + 1
  }

  return valid
    .map(({ id, name, sire, mare }) => ({ id, name, sire, mare, sire_count: sireCounts[sire] }))
    .sort((a, b) => b.sire_count - a.sire_count)
}

async function main() {
  const yargs = require('yargs/yargs')
  const { hideBin } = require('yargs/helpers')

  const argv = yargs(hideBin(process.argv))
    .option('age', { type: 'number', default: 2, description: 'target age' })
    .option('output', {
      alias: 'o',
      type: 'string',
      default: 'horse_catalogue.json',
      description: 'output filename',
    })
    .option('n', { type: 'number', default: null, description: 'max sample' })
    .help().argv

  const { age, output, n: maxSample } = argv
  const outputPath = path.resolve(output)
  const baseParams = { pid: 'horse_list', under_age: age, over_age: age, list: 100, sort: 'prize' }

  let spinner = ora(chalk.blue('Fetching page 1/...')).start()

  try {
    const firstHtml = await fetchHtml({ ...baseParams, page: 1 })
    const lastPageNo = getLastPageNo(firstHtml)
    const seen = new Set()
    const allHorses = []

    const addHorses = (horses) => {
      for (const h of horses) {
        if (!seen.has(h.id)) {
          seen.add(h.id)
          allHorses.push(h)
        }
      }
    }

    addHorses(parseHorseResults(firstHtml))

    const pageWidth = String(lastPageNo).length
    const pageStr = (p) => String(p).padStart(pageWidth)
    const totalStr = (n) => String(n).padStart(6)

    spinner.succeed(
      chalk.green(
        `Page ${pageStr(1)}/${lastPageNo} \u2014 +${String(allHorses.length).padStart(3)} horses (${totalStr(allHorses.length)} total)`,
      ),
    )

    for (let page = 2; page <= lastPageNo; page++) {
      if (maxSample !== null && allHorses.length >= maxSample) break
      spinner = ora(chalk.blue(`Fetching page ${pageStr(page)}/${lastPageNo}...`)).start()
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const html = await fetchHtml({ ...baseParams, page })
      const before = allHorses.length
      addHorses(parseHorseResults(html))
      const added = allHorses.length - before
      spinner.succeed(
        chalk.green(
          `Page ${pageStr(page)}/${lastPageNo} \u2014 +${String(added).padStart(3)} horses (${totalStr(allHorses.length)} total)`,
        ),
      )
    }

    const horses = maxSample !== null ? allHorses.slice(0, maxSample) : allHorses
    const data = buildCatalogue(horses)

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))

    console.log(
      chalk.green(`\u2714 Saved ${String(data.length).padStart(6)} horses \u2192 ${outputPath}`),
    )
  } catch (err) {
    spinner.fail(chalk.red(String(err.message || err)))
    throw err
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

module.exports = { parseHorseResults, getLastPageNo, buildCatalogue }
