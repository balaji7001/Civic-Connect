const positiveWeights: Record<string, number> = {
  thanks: -1.3,
  appreciate: -1.2,
  resolved: -1.4,
  fixed: -1.1,
  okay: -0.5,
};

const negativeWeights: Record<string, number> = {
  urgent: 2.2,
  dangerous: 2.4,
  angry: 2.7,
  terrible: 2.3,
  bad: 1.5,
  leaking: 1.4,
  overflow: 1.8,
  broken: 1.9,
  sewage: 1.7,
  outage: 1.8,
  accident: 2.1,
  unsafe: 2.3,
};

const sigmoid = (value: number): number => 1 / (1 + Math.exp(-value));

export const predictSentimentScore = (text: string): number => {
  const normalized = text.toLowerCase();
  const tokens = normalized.split(/\s+/);
  const bias = -0.25;

  const weightedScore = tokens.reduce((score, token) => {
    return score + (negativeWeights[token] || 0) + (positiveWeights[token] || 0);
  }, bias);

  return Number(sigmoid(weightedScore).toFixed(4));
};

