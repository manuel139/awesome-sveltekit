import { fork } from 'child_process'
import { URL } from 'url'

export const root_dir = new URL(`../..`, import.meta.url).pathname

export function title_to_slug(title) {
  return title.toLowerCase().replaceAll(` `, `-`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // module was not imported but called directly
  // process.argv.slice(2) passes on CLI args to child process
  fork(`${root_dir}/site/scripts/parseSitesYaml.js`, process.argv.slice(2))
  fork(`${root_dir}/site/scripts/screenshots.js`, process.argv.slice(2))
  fork(`${root_dir}/site/scripts/readmeSiteList.js`, process.argv.slice(2))
}
