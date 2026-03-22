import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import FileUploader from "../components/FileUploader";
import ImageLightbox from "../components/ImageLightbox";
import Loader from "../components/Loader";
import MapView from "../components/MapView";
import RemarksPanel from "../components/RemarksPanel";
import { useToast } from "../hooks/useToast";
import api, { extractApiError, type AiAnalysis, type Complaint } from "../services/api";

const defaultPosition: [number, number] = [17.385, 78.4867];

const buildAnalysisSnapshot = (complaint: Complaint): AiAnalysis => ({
  category: complaint.category,
  priority: complaint.priority,
  sentimentScore: complaint.sentimentScore,
  duplicateScore: complaint.duplicateScore,
  severityScore: complaint.severityScore,
});

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const SubmitComplaint = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const complaintId = searchParams.get("complaintId");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComplaint, setIsLoadingComplaint] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  useEffect(() => {
    if (!complaintId || submittedComplaint?.complaintId === complaintId) {
      return;
    }

    const loadComplaint = async () => {
      setIsLoadingComplaint(true);
      try {
        const response = await api.get<{ data: Complaint }>(`/complaints/${complaintId}`);
        const complaint = response.data.data;
        setSubmittedComplaint(complaint);
        setAiAnalysis(buildAnalysisSnapshot(complaint));
        setTitle(complaint.title);
        setDescription(complaint.description);
        setCategory(complaint.category);
        setAddress(complaint.address);
        setSelectedPosition([complaint.location.coordinates[1], complaint.location.coordinates[0]]);
        setSuccessMessage("You can improve the complaint details below and rerun the AI analysis.");
      } catch (loadError) {
        const message = extractApiError(loadError);
        setError(message);
        showToast({ tone: "error", title: "Could not load complaint", message });
      } finally {
        setIsLoadingComplaint(false);
      }
    };

    void loadComplaint();
  }, [complaintId, showToast, submittedComplaint?.complaintId]);

  useEffect(() => {
    if (complaintId || selectedPosition) {
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedPosition([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        setSelectedPosition(null);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [complaintId, selectedPosition]);

  const mode = useMemo(() => (submittedComplaint || complaintId ? "update" : "create"), [complaintId, submittedComplaint]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setAddress("");
    setSelectedFile(null);
    setSubmittedComplaint(null);
    setAiAnalysis(null);
    setError("");
    setSuccessMessage("");
    setSearchParams({});
    setSelectedPosition(null);
  };

  if (isLoadingComplaint && complaintId && !submittedComplaint) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <Loader label="Loading complaint details..." className="min-h-[40vh]" />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Complaint submission</p>
        <h1 className="mt-2 font-serif text-4xl font-bold">{mode === "update" ? "Improve your complaint and rerun the AI review" : "Report a civic issue in under a minute"}</h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <form
          className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!selectedPosition) {
              setError("Choose a map location or detect your location before submitting.");
              return;
            }

            setError("");
            setSuccessMessage("");
            setIsSubmitting(true);
            try {
              const formData = new FormData();
              formData.append("title", title);
              formData.append("description", description);
              formData.append("address", address);
              formData.append("longitude", String(selectedPosition[1]));
              formData.append("latitude", String(selectedPosition[0]));
              if (category) {
                formData.append("category", category);
              }
              if (selectedFile) {
                formData.append("image", selectedFile);
              }

              const response = mode === "update" && (submittedComplaint?.complaintId || complaintId)
                ? await api.patch<{ data: { complaint: Complaint; aiAnalysis: AiAnalysis } }>(
                    `/complaints/${submittedComplaint?.complaintId || complaintId}`,
                    formData,
                    {
                      headers: {
                        "Content-Type": "multipart/form-data",
                      },
                    },
                  )
                : await api.post<{ data: { complaint: Complaint; aiAnalysis: AiAnalysis } }>("/complaints", formData, {
                    headers: {
                      "Content-Type": "multipart/form-data",
                    },
                  });

              setSubmittedComplaint(response.data.data.complaint);
              setAiAnalysis(response.data.data.aiAnalysis);
              const message = mode === "update"
                ? "Complaint updated successfully. The AI analysis has been refreshed below."
                : "Complaint submitted successfully. Review the AI analysis below, then edit any detail if you want a better classification.";
              setSuccessMessage(message);
              showToast({ tone: "success", title: mode === "update" ? "Complaint updated" : "Complaint submitted", message });
              setSearchParams({ complaintId: response.data.data.complaint.complaintId });
              setSelectedFile(null);
            } catch (submitError) {
              const message = extractApiError(submitError);
              setError(message);
              showToast({ tone: "error", title: "Submission failed", message });
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div>
            <label className="mb-2 block text-sm font-semibold">Complaint title</label>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Garbage overflowing near market" required disabled={isSubmitting || isLoadingComplaint} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Description</label>
            <textarea
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what happened, how long it has been happening, and any public safety impact."
              required
              disabled={isSubmitting || isLoadingComplaint}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Category</label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} disabled={isSubmitting || isLoadingComplaint}>
              <option value="">Auto-detect with AI</option>
              <option value="garbage">Garbage</option>
              <option value="water">Water</option>
              <option value="electricity">Electricity</option>
              <option value="road">Road</option>
              <option value="drainage">Drainage</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold">Address or landmark</label>
            <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Ward 12 Public School" required disabled={isSubmitting || isLoadingComplaint} />
          </div>
          <FileUploader onChange={setSelectedFile} />
          {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-200">{error}</p> : null}
          {successMessage ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">{successMessage}</p> : null}
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={isSubmitting || isLoadingComplaint} className="rounded-full bg-civic-blue px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? (mode === "update" ? "Updating complaint..." : "Submitting complaint...") : mode === "update" ? "Update Complaint" : "Submit Complaint"}
            </button>
            {(submittedComplaint || complaintId) ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Start New Complaint
              </button>
            ) : null}
            <Link to="/dashboard" className="rounded-full border border-civic-teal px-5 py-3 text-sm font-bold text-civic-teal">
              Go to My Dashboard
            </Link>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">AI analysis</p>
            <h2 className="mt-2 text-2xl font-bold">{aiAnalysis ? "Your complaint intelligence summary" : "Submit once to see the AI review"}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Civic Connect evaluates category, priority, sentiment, duplicate risk, and severity so you can refine the complaint before it moves deeper into the municipal workflow.
            </p>
            {aiAnalysis ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Detected category</p>
                  <p className="mt-2 text-lg font-bold capitalize">{aiAnalysis.category}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {typeof aiAnalysis.categoryConfidence === "number"
                      ? `Confidence ${formatPercent(aiAnalysis.categoryConfidence)}`
                      : "Confidence available after fresh analysis"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Priority</p>
                  <p className="mt-2 text-lg font-bold">{aiAnalysis.priority}</p>
                  <p className="mt-1 text-sm text-slate-500">Severity score {aiAnalysis.severityScore}/100</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sentiment score</p>
                  <p className="mt-2 text-lg font-bold">{formatPercent(aiAnalysis.sentimentScore)}</p>
                  <p className="mt-1 text-sm text-slate-500">Higher values indicate stronger urgency or dissatisfaction.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Duplicate probability</p>
                  <p className="mt-2 text-lg font-bold">{formatPercent(aiAnalysis.duplicateScore)}</p>
                  <p className="mt-1 text-sm text-slate-500">{aiAnalysis.isDuplicate ? "This may overlap with an existing complaint." : "No strong duplicate detected."}</p>
                </div>
              </div>
            ) : null}
            {submittedComplaint ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{submittedComplaint.complaintId}</p>
                <p className="mt-2">Department: {submittedComplaint.department}</p>
                <p className="mt-1">Status: {submittedComplaint.status}</p>
                <p className="mt-1">SLA deadline: {new Date(submittedComplaint.slaDeadline).toLocaleString()}</p>
                {aiAnalysis?.relatedComplaintIds?.length ? <p className="mt-2">Related complaints: {aiAnalysis.relatedComplaintIds.join(", ")}</p> : null}
              </div>
            ) : null}

            {submittedComplaint?.imageUrl ? (
              <button
                type="button"
                onClick={() => setShowImageViewer(true)}
                className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 text-left dark:border-slate-800 dark:bg-slate-950"
              >
                <img src={submittedComplaint.imageThumbnailUrl || submittedComplaint.imageUrl} alt={submittedComplaint.title} loading="lazy" className="h-48 w-full object-cover" />
                <div className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">View uploaded complaint image</div>
              </button>
            ) : null}
          </div>

          {submittedComplaint ? (
            <RemarksPanel remarks={submittedComplaint.remarks} title="Department remarks" emptyMessage="No department remarks have been added to this complaint yet." />
          ) : null}

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-civic-teal">Location capture</p>
            <h2 className="mt-2 text-2xl font-bold">Click the map to refine the incident point</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              We use your device location first, then let you correct the exact spot on the map so the responsible department can dispatch faster.
            </p>
            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) {
                  setError("Geolocation is not supported in this browser.");
                  return;
                }

                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setError("");
                    setSelectedPosition([position.coords.latitude, position.coords.longitude]);
                  },
                  () => {
                    setError("We could not detect your location. Please allow location access and try again.");
                  },
                  { enableHighAccuracy: true, timeout: 8000 },
                );
              }}
              className="mt-4 rounded-full border border-civic-teal px-5 py-3 text-sm font-bold text-civic-teal"
            >
              Detect My Location
            </button>
          </div>
          <MapView selectable center={selectedPosition || defaultPosition} selectedPosition={selectedPosition} onLocationSelect={setSelectedPosition} heightClassName="h-[32rem]" />
        </div>
      </div>

      <ImageLightbox imageUrl={submittedComplaint?.imageUrl} title={submittedComplaint?.title} isOpen={showImageViewer} onClose={() => setShowImageViewer(false)} />
    </section>
  );
};

export default SubmitComplaint;

