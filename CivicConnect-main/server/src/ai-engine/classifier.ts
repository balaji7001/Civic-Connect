const trainingData = [
  {
    category: "garbage",
    samples: [
      "garbage overflow near market",
      "trash bins are full",
      "waste not collected in the street",
      "garbage smell in ward",
    ],
  },
  {
    category: "water",
    samples: [
      "water pipe leakage",
      "no water supply today",
      "tap water problem in lane",
      "water tanker needed immediately",
    ],
  },
  {
    category: "electricity",
    samples: [
      "streetlight not working",
      "power outage in neighborhood",
      "electric pole spark issue",
      "transformer failure near road",
    ],
  },
  {
    category: "road",
    samples: [
      "road pothole is dangerous",
      "damaged street surface needs repair",
      "main road broken after rain",
      "road crack causing accidents",
    ],
  },
  {
    category: "drainage",
    samples: [
      "drain blocked with sewage",
      "drainage overflow near houses",
      "storm water drain clogged",
      "dirty water from drain coming out",
    ],
  },
] as const;

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);

const vocabulary = new Set(trainingData.flatMap((entry) => entry.samples.flatMap(tokenize)));
const totalSamples = trainingData.reduce((sum, item) => sum + item.samples.length, 0);

const categoryTokenCounts = trainingData.map((entry) => {
  const counts = new Map<string, number>();
  let total = 0;

  entry.samples.forEach((sample) => {
    tokenize(sample).forEach((token) => {
      counts.set(token, (counts.get(token) || 0) + 1);
      total += 1;
    });
  });

  return {
    category: entry.category,
    counts,
    total,
    prior: entry.samples.length / totalSamples,
  };
});

export const classifyCategory = (text: string) => {
  const tokens = tokenize(text);
  const vocabSize = vocabulary.size || 1;

  const scores = categoryTokenCounts.map((entry) => {
    const logScore = tokens.reduce((score, token) => {
      const tokenCount = entry.counts.get(token) || 0;
      return score + Math.log((tokenCount + 1) / (entry.total + vocabSize));
    }, Math.log(entry.prior));

    return {
      category: entry.category,
      score: logScore,
    };
  });

  const bestMatch = scores.reduce((best, current) =>
    current.score > best.score ? current : best,
  );

  return {
    category: bestMatch.category,
    confidence: Number((1 / (1 + Math.exp(-bestMatch.score))).toFixed(4)),
  };
};

