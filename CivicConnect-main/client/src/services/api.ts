import axios from "axios";

export type UserRole = "citizen" | "admin";
export type TrendDirection = "up" | "down" | "neutral";

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  ward: string;
  address: string;
  falseComplaintCount?: number;
  isSuspended?: boolean;
  suspendedAt?: string;
  suspensionReason?: string;
}

export interface ComplaintRemark {
  message: string;
  authorId?: string;
  authorName: string;
  createdAt: string;
}

export interface Complaint {
  _id: string;
  complaintId: string;
  title: string;
  description: string;
  category: "garbage" | "water" | "electricity" | "road" | "drainage";
  priority: "Low" | "Medium" | "High";
  severityScore: number;
  sentimentScore: number;
  duplicateScore: number;
  status: "Pending" | "In Progress" | "Resolved" | "Rejected";
  department: string;
  citizenId?: User | string;
  imageUrl?: string;
  imageThumbnailUrl?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  address: string;
  slaDeadline: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  remarks: ComplaintRemark[];
}

export interface AppNotification {
  _id: string;
  complaintId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrendMetric {
  value: number;
  current: number;
  previous: number;
  trend: number;
  direction: TrendDirection;
}

export interface AiAnalysis {
  category: Complaint["category"];
  categoryConfidence?: number;
  priority: Complaint["priority"];
  sentimentScore: number;
  duplicateScore: number;
  severityScore: number;
  isDuplicate?: boolean;
  relatedComplaintIds?: string[];
}

export interface Department {
  _id: string;
  name: string;
  description: string;
  headOfficer: string;
  contactEmail: string;
}

export interface AnalyticsPoint {
  category?: string;
  ward?: string;
  label?: string;
  count: number;
  formattedLabel?: string;
}

export interface SeverityPoint {
  complaintId: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  severityScore: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const inferredApiUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : "http://localhost:5000/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || inferredApiUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("civic-connect-token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const extractApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Cannot reach the backend API. Start the server, check VITE_API_URL, and confirm CORS allows the frontend origin.";
    }

    if (error.response.status === 429) {
      return "Too many requests. Please try again later.";
    }

    return (error.response.data as { message?: string } | undefined)?.message || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
};

export default api;




