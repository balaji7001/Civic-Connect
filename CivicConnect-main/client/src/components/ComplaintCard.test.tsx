import { render, screen } from "@testing-library/react";

import ComplaintCard from "./ComplaintCard";
import type { Complaint } from "../services/api";
const complaint: Complaint = {
  _id: "1",
  complaintId: "CMP-123456-4321",
  title: "Streetlight outage near park",
  description: "The streetlight has been off for two nights and the area feels unsafe.",
  category: "electricity",
  priority: "High",
  severityScore: 92,
  sentimentScore: 0.83,
  duplicateScore: 0.2,
  status: "In Progress",
  department: "Electrical Maintenance Wing",
  citizenId: {
    id: "user-1",
    name: "Asha",
    email: "asha@example.com",
    role: "citizen",
    ward: "Ward 4",
    address: "4 Lake View Road",
  },
  location: {
    type: "Point",
    coordinates: [78.4, 17.3],
  },
  address: "Ward 4 Park",
  slaDeadline: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  remarks: [],
};

it("renders complaint details and timeline information", () => {
  render(<ComplaintCard complaint={complaint} showCitizen showTimeline />);

  expect(screen.getByText("Streetlight outage near park")).toBeInTheDocument();
  expect(screen.getByText("92/100")).toBeInTheDocument();
  expect(screen.getByText(/Reported by Asha/)).toBeInTheDocument();
  expect(screen.getByText("AI Analysis Complete")).toBeInTheDocument();
});
