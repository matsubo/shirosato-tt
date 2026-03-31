/**
 * Calculate the arithmetic mean of an array of numbers.
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Calculate the population standard deviation.
 */
export function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squaredDiffs = values.map((v) => (v - avg) ** 2);
  return Math.sqrt(mean(squaredDiffs));
}

/**
 * Calculate deviation value (inverted for time - lower time is better).
 * Standard deviation formula: 50 + 10 * (mean - value) / stddev
 * For time-based metrics, a lower value yields a higher deviation score.
 */
export function calcDeviation(value: number, values: number[]): number {
  const sd = stddev(values);
  if (sd === 0) return 50;
  const avg = mean(values);
  return 50 + (10 * (avg - value)) / sd;
}

/**
 * Calculate the coefficient of variation (CV) as a percentage.
 */
export function calcCV(values: number[]): number {
  const avg = mean(values);
  if (avg === 0) return 0;
  return (stddev(values) / avg) * 100;
}

/**
 * Calculate the percentile rank of a value within a dataset.
 * For time-based data, lower is better so we count values greater than the given value.
 */
export function calcPercentile(value: number, values: number[]): number {
  if (values.length === 0) return 0;
  const count = values.filter((v) => v > value).length;
  return (count / values.length) * 100;
}

/**
 * Calculate a simple moving average over a window size.
 */
export function calcMovingAverage(values: number[], windowSize: number): number[] {
  if (windowSize <= 0 || values.length === 0) return [];
  const result: number[] = [];
  for (let i = 0; i <= values.length - windowSize; i++) {
    const window = values.slice(i, i + windowSize);
    result.push(mean(window));
  }
  return result;
}
