/* eslint-disable no-console */
import fs from 'fs'
import imagemin from 'imagemin'
import imageminWebp from 'imagemin-webp'
import yaml from 'js-yaml'
import { performance } from 'perf_hooks'
import puppeteer from 'puppeteer'
import { rootDir, titleToSlug } from './index.js'

const start = performance.now()
const outDir = `${rootDir}/site/static/screenshots`

const sites = yaml.load(fs.readFileSync(`${rootDir}/sites.yml`))

const browser = await puppeteer.launch()
const page = await browser.newPage()

fs.mkdirSync(outDir, { recursive: true })

const updateExisting = process.argv[2] === `update-existing`

if (updateExisting) console.log(`Updating all existing screenshots`)

const [created, updated, skipped, existed] = [[], [], [], []]

for (const [idx, site] of sites.entries()) {
  site.slug = titleToSlug(site.title)
  const { slug } = site

  const imgPath = `${outDir}/${slug}.webp`
  const imgExists = fs.existsSync(imgPath)

  if (!updateExisting && imgExists) {
    existed.push(site.slug)
    continue
  }

  console.log(`${idx + 1}/${sites.length}: ${slug}`)

  try {
    try {
      await page.goto(site.url, { timeout: 5000, waitUntil: `networkidle2` })
    } catch (error) {
      if (error instanceof puppeteer.errors.TimeoutError) {
        // retry page.goto(), this time waiting only for 'load' event
        await page.goto(site.url, { timeout: 5000, waitUntil: `load` })
      } else {
        throw error // rethrow if not a TimeoutError
      }
    }
  } catch (error) {
    console.log(`skipping ${slug} due to ${error}`)
    skipped.push(site.slug)
  }

  await page.waitForTimeout(1000) // wait 1s for sites with landing animations to settle
  // e.g. https://mortimerbaltus.com, https://flayks.com
  await page.setViewport({ width: 1200, height: 900 })
  await page.screenshot({ path: imgPath })
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 0.5 })
  await page.screenshot({ path: `${outDir}/${slug}.small.webp` })

  if (imgExists) updated.push(site.slug)
  else created.push(site.slug)
}

await browser.close()

const wallTime = ((performance.now() - start) / 1000).toFixed(2)

if (created.length > 0 || updated.length > 0 || existed.length > 0) {
  console.log(
    `screenshots.js took ${wallTime}s, created ${created.length} new, ${updated.length} updated, ${skipped.length} skipped, ${existed.length} already had screenshots`
  )

  const toCompress = [...created, ...updated].flatMap((slug) => [
    `${outDir}/${slug}.webp`,
    `${outDir}/${slug}.small.webp`,
  ])

  const compressedFiles = await imagemin(toCompress, {
    destination: outDir,
    plugins: [imageminWebp({ quality: 50 })],
  })

  console.log(`compressed ${compressedFiles.length} files`)
} else {
  console.log(`no changes from screenshots.js in ${wallTime}s`)
}
