import { writable } from 'svelte/store'

export const sortByOptions = [
  ``,
  `Date created`,
  `Date last updated`,
  `GitHub repo stars`,
] as const

export type sortByType = typeof sortByOptions[number]

export const sortBy = writable<sortByType>(``)

export const filterTags = writable<string[]>([])

export const tagFilterMode = writable<`and` | `or`>(`or`)

tagFilterMode.subscribe((mode) => {
  if ([`and`, `or`].includes(mode)) return mode
})
