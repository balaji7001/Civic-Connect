import type { ComplaintDocument } from "../models/Complaint";

const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);

const termFrequency = (tokens: string[]) => {
  const tf = new Map<string, number>();

  tokens.forEach((token) => {
    tf.set(token, (tf.get(token) || 0) + 1);
  });

  return tf;
};

const cosineSimilarity = (left: Map<string, number>, right: Map<string, number>) => {
  const terms = new Set([...left.keys(), ...right.keys()]);
  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  terms.forEach((term) => {
    const l = left.get(term) || 0;
    const r = right.get(term) || 0;
    dotProduct += l * r;
    leftMagnitude += l * l;
    rightMagnitude += r * r;
  });

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
};

export const detectDuplicateComplaint = (
  inputText: string,
  complaints: ComplaintDocument[],
): {
  duplicateScore: number;
  isDuplicate: boolean;
  relatedComplaintIds: string[];
} => {
  const targetTokens = tokenize(inputText);
  const targetTf = termFrequency(targetTokens);
  const documentCount = complaints.length + 1;
  const documentFrequency = new Map<string, number>();

  complaints.forEach((complaint) => {
    new Set(tokenize(`${complaint.title} ${complaint.description}`)).forEach((token) => {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    });
  });

  const buildTfidf = (tf: Map<string, number>) => {
    const vector = new Map<string, number>();

    tf.forEach((count, term) => {
      const idf = Math.log((documentCount + 1) / ((documentFrequency.get(term) || 0) + 1)) + 1;
      vector.set(term, count * idf);
    });

    return vector;
  };

  const targetVector = buildTfidf(targetTf);
  const rankedMatches = complaints
    .map((complaint) => {
      const complaintVector = buildTfidf(
        termFrequency(tokenize(`${complaint.title} ${complaint.description}`)),
      );

      return {
        complaintId: complaint.complaintId,
        score: cosineSimilarity(targetVector, complaintVector),
      };
    })
    .sort((left, right) => right.score - left.score);

  const topScore = rankedMatches[0]?.score || 0;

  return {
    duplicateScore: Number(topScore.toFixed(4)),
    isDuplicate: topScore > 0.8,
    relatedComplaintIds: rankedMatches
      .filter((match) => match.score > 0.6)
      .slice(0, 3)
      .map((match) => match.complaintId),
  };
};

