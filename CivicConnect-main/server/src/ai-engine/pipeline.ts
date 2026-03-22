import type { ComplaintDocument } from "../models/Complaint";

import { classifyCategory } from "./classifier";
import { detectDuplicateComplaint } from "./duplicateDetector";
import { predictSentimentScore } from "./sentiment";

export type ComplaintCategory = "garbage" | "water" | "electricity" | "road" | "drainage";
export type ComplaintPriority = "Low" | "Medium" | "High";

const priorityFromDecisionTree = ({
  category,
  sentimentScore,
  duplicateScore,
  text,
}: {
  category: ComplaintCategory;
  sentimentScore: number;
  duplicateScore: number;
  text: string;
}): ComplaintPriority => {
  const normalizedText = text.toLowerCase();
  const urgentSignal =
    /(urgent|danger|unsafe|outage|accident|overflow|fire|sewage)/.test(normalizedText) ||
    sentimentScore > 0.82;

  if (
    category === "electricity" &&
    (urgentSignal || duplicateScore > 0.75 || normalizedText.includes("streetlight"))
  ) {
    return "High";
  }

  if ((category === "water" || category === "drainage") && (urgentSignal || duplicateScore > 0.8)) {
    return "High";
  }

  if (urgentSignal || duplicateScore > 0.9) {
    return "High";
  }

  if (sentimentScore > 0.55 || ["road", "garbage"].includes(category)) {
    return "Medium";
  }

  return "Low";
};

const priorityWeights: Record<ComplaintPriority, number> = {
  Low: 35,
  Medium: 60,
  High: 85,
};

const computeSeverityScore = ({
  priority,
  sentimentScore,
  duplicateScore,
}: {
  priority: ComplaintPriority;
  sentimentScore: number;
  duplicateScore: number;
}) => {
  const base = priorityWeights[priority];
  const sentimentContribution = sentimentScore * 15;
  const duplicateContribution = duplicateScore * 10;
  return Math.min(100, Math.round(base + sentimentContribution + duplicateContribution));
};

export const runAiPipeline = ({
  title,
  description,
  existingComplaints,
  categoryHint,
}: {
  title: string;
  description: string;
  existingComplaints: ComplaintDocument[];
  categoryHint?: string;
}) => {
  const combinedText = `${title} ${description}`;
  const classified = classifyCategory(combinedText);
  const category = (categoryHint || classified.category) as ComplaintCategory;
  const sentimentScore = predictSentimentScore(combinedText);
  const duplicateResult = detectDuplicateComplaint(combinedText, existingComplaints);
  const priority = priorityFromDecisionTree({
    category,
    sentimentScore,
    duplicateScore: duplicateResult.duplicateScore,
    text: combinedText,
  });
  const severityScore = computeSeverityScore({
    priority,
    sentimentScore,
    duplicateScore: duplicateResult.duplicateScore,
  });

  return {
    category,
    categoryConfidence: classified.confidence,
    priority,
    sentimentScore,
    duplicateScore: duplicateResult.duplicateScore,
    severityScore,
    isDuplicate: duplicateResult.isDuplicate,
    relatedComplaintIds: duplicateResult.relatedComplaintIds,
  };
};

