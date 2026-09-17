export interface RandomSource { next(): number }
export const systemRandom: RandomSource = { next: () => Math.random() }
export const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum)
export const randomInt = (random: RandomSource, minimum: number, maximum: number) => minimum + Math.floor(random.next() * (maximum - minimum + 1))
