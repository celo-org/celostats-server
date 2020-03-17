export function getRandomArbitrary(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function getRandomInt(min: number, max: number) {
  return Math.floor(getRandomArbitrary(min, max))
}

export function fuzzy(x: number, volatilityPercent: number) {
  const r = getRandomArbitrary(0, volatilityPercent)
  const f = (x / 100) * r
  return x + f
}
