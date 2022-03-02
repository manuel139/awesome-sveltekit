/* eslint-disable no-console */
/* This file parses sites.yml, then updates the list of sites in the readme. */

import fs from 'fs'
import yaml from 'js-yaml'
import { basename } from 'path'
import { root_dir } from './index.js'

const readmePath = `${root_dir}/readme.md`
const sitesYaml = `${root_dir}/sites.yml`

const readme = fs.readFileSync(readmePath, `utf8`)
const sites = yaml.load(fs.readFileSync(sitesYaml))

const new_sites = sites
  .map((site, idx) => {
    const { title, repo, uses, description, url, siteSrc } = site

    if ([title, uses, description, url].includes(undefined)) {
      throw new Error(`missing field(s) in site '${title}'`)
    }

    try {
      let codeLink = ``
      if (repo) {
        const repoHandle = repo.split(`github.com/`)[1]
        if (repoHandle.split(`/`).length !== 2) {
          throw `bad repo handle ${repoHandle}`
        }
        codeLink =
          `&emsp;[[code](${siteSrc ?? repo})]` +
          `&emsp;<img src="https://img.shields.io/github/stars/${repoHandle}" alt="GitHub stars" valign="middle">`
      }

      const indent = ` `.repeat(idx > 8 ? 4 : 3)
      let metadata = description
      if (uses?.length > 0) {
        metadata += `<br>\n${indent}uses: [${uses.join(`], [`)}]`
      }

      return `${
        idx + 1
      }. **[${title}](${url})**${codeLink}<br>\n${indent}${metadata}`
    } catch (err) {
      throw `${err} for site '${title}'`
    }
  })
  .join(`\n`)

// replace old sites
const newReadme = readme.replace(
  /## Sites\n\n[\s\S]+\n\n## /, // match everything up to next heading
  `## Sites\n\n${new_sites}\n\n## `
)

fs.writeFileSync(readmePath, newReadme)

const this_file = basename(process.argv[1])
console.log(`${this_file} updated readme\n`)
