/** Small deterministic PRNG so synthetic data stays stable across reloads for the same seed. */

function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededRandom(seed: string): () => number {
  return mulberry32(hashSeed(seed))
}

export function pickN<T>(items: T[], n: number, rand: () => number): T[] {
  const pool = [...items]
  const picked: T[] = []
  while (pool.length && picked.length < n) {
    const idx = Math.floor(rand() * pool.length)
    picked.push(pool.splice(idx, 1)[0])
  }
  return picked
}
