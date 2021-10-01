/* eslint-disable no-console */
import fs from 'fs'

import yaml from 'js-yaml'
import fetch from 'node-fetch'

import { rootDir } from './index.js'

const sites = yaml.load(fs.readFileSync(`${rootDir}/sites.yml`))

for (const site of sites) {
  if (!site.repo) continue

  const repoHandle = site.repo.split(`github.com/`)[1]
  const response = await fetch(`https://api.github.com/repos/${repoHandle}`)
  const json = await response.json()
  site.repoStars = json.stargazers_count
}

fs.writeFileSync(
  `${rootDir}/site/src/sites.ts`,
  `export default ${JSON.stringify(sites, null, 2)}`
)

console.log(`Finished parsing sites.yml`)
