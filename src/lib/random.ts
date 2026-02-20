export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function sampleTriangular(min: number, mode: number, max: number): number {
  const u = Math.random();
  const c = (mode - min) / (max - min);
  if (u < c) {
    return min + Math.sqrt(u * (max - min) * (mode - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

export function sampleTruncatedNormal(mean: number, stdDev: number, min: number, max: number): number {
  for (let i = 0; i < 12; i += 1) {
    const u1 = Math.max(Math.random(), 1e-10);
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const candidate = mean + z0 * stdDev;
    if (candidate >= min && candidate <= max) {
      return candidate;
    }
  }
  return Math.min(max, Math.max(min, sampleTriangular(min, mean, max)));
}

export function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max + 1));
}
