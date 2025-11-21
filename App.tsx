import React, { useState, useEffect } from "react";
import ImageUploader from "./components/ImageUploader";
import ResultsGrid from "./components/ResultsGrid";
import { processZwdsChart } from "./services/imageProcessingService";
import { generateZwdsReport } from "./services/geminiService";
import { downloadReportAsWord } from "./services/documentService";
import { ProcessedImage, AppView, ProcessingStatus } from "./types";

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.UPLOAD);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [results, setResults] = useState<ProcessedImage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Verification State
  const [isVerified, setIsVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyError, setVerifyError] = useState("");

  // Core processing logic (extracted from original handleUpload)
  const processFile = async (file: File) => {
    try {
      setStatus(ProcessingStatus.PROCESSING);
      setErrorMsg(null);
      setReport(null);

      // Give UI a moment to update before freezing with processing
      setTimeout(async () => {
        try {
          const data = await processZwdsChart(file);

          if (data.regions.length !== 13) {
            setErrorMsg(
              `Warning: Expected 13 regions, but detected ${data.regions.length}. Filters may need adjustment for this specific chart style.`,
            );
          }

          setResults(data);
          setStatus(ProcessingStatus.COMPLETE);
          setView(AppView.RESULTS);
        } catch (err) {
          console.error(err);
          setStatus(ProcessingStatus.ERROR);
          setErrorMsg("Failed to process image. Please try a clearer image.");
        }
      }, 100);
    } catch (e) {
      setStatus(ProcessingStatus.ERROR);
      setErrorMsg("An unexpected error occurred.");
    }
  };

  // Intercepts the upload to check verification
  const handleUploadAttempt = (file: File) => {
    if (isVerified) {
      processFile(file);
    } else {
      setPendingFile(file);
      setVerifyInput("");
      setVerifyError("");
      setShowVerifyModal(true);
    }
  };

  const handleVerifySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (verifyInput === "TanGroup") {
      setIsVerified(true);
      setShowVerifyModal(false);
      if (pendingFile) {
        processFile(pendingFile);
        setPendingFile(null);
      }
    } else {
      setVerifyError("Incorrect keyword. Upload not allowed.");
    }
  };

  const handleVerifyCancel = () => {
    setShowVerifyModal(false);
    setPendingFile(null);
    setVerifyInput("");
    setVerifyError("");
  };

  const handleReset = () => {
    setView(AppView.UPLOAD);
    setResults(null);
    setStatus(ProcessingStatus.IDLE);
    setErrorMsg(null);
    // Note: We do NOT reset isVerified so the user doesn't have to enter it every time within the session
  };

  const triggerAnalysis = async () => {
    if (!results || results.regions.length === 0) return;
    setIsAnalyzing(true);
    try {
      // Convert all 13 region blobs to base64
      const base64Promises = results.regions.map((region) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              const base64 = (reader.result as string).split(",")[1];
              resolve(base64);
            } else {
              reject(new Error("Failed to read blob"));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(region.blob);
        });
      });

      const imagesBase64 = await Promise.all(base64Promises);

      try {
        const text = await generateZwdsReport(imagesBase64);
        setReport(text);
      } catch (err) {
        console.log(err, "tester");
        setReport("Analysis failed or API Key missing.");
      } finally {
        setIsAnalyzing(false);
      }
    } catch (e) {
      setIsAnalyzing(false);
      setReport("Error preparing images for analysis.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0a1e] text-gray-100 selection:bg-indigo-500 selection:text-white relative">
      {/* Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-[#1a1625] border border-indigo-500/30 rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all scale-100">
            <h2 className="text-2xl font-bold text-white mb-4">
              Security Verification
            </h2>
            <p className="text-gray-400 mb-6">
              Please enter the keyword to proceed with the upload.
            </p>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value)}
                  placeholder="Enter keyword"
                  className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-gray-600 transition-colors"
                  autoFocus
                />
                {verifyError && (
                  <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {verifyError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleVerifyCancel}
                  className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-colors"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation / Header */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-300">
                ZWDS<span className="font-light text-gray-400">Vision</span>
              </span>
            </div>
            {view === AppView.RESULTS && (
              <button
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 17l-5-5m0 0l5-5m-5 5h12"
                  />
                </svg>
                Upload New Chart
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Display (General App Errors) */}
        {errorMsg && (
          <div className="mb-8 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3 animate-fade-in">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-200">{errorMsg}</p>
          </div>
        )}

        {view === AppView.UPLOAD && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="text-center space-y-4 max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                Automated Chart Segmentation
              </h1>
              <p className="text-lg text-indigo-200/70">
                Expert computer vision model specialized in extracting the 13
                structural palaces from ZWDS charts. Uses Euclidean color
                distance filtering (#451b7d) and connected component labeling.
              </p>
            </div>

            <ImageUploader
              onUpload={handleUploadAttempt}
              isProcessing={status === ProcessingStatus.PROCESSING}
            />

            {status === ProcessingStatus.PROCESSING && (
              <div className="flex items-center gap-3 text-indigo-400 animate-pulse">
                <div
                  className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
                <span className="text-sm font-medium uppercase tracking-widest">
                  Processing Geometry
                </span>
              </div>
            )}
          </div>
        )}

        {view === AppView.RESULTS && results && (
          <div className="space-y-8">
            <ResultsGrid data={results} />

            {/* Gemini AI Analysis Section */}
            <div className="mt-12 bg-gradient-to-b from-gray-800/30 to-transparent p-8 rounded-2xl border border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h2 className="text-xl font-bold text-white">
                    AI Master Document Generation
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {report && (
                    <button
                      onClick={() => downloadReportAsWord(report)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Download Word Doc
                    </button>
                  )}

                  {!report && (
                    <button
                      onClick={triggerAnalysis}
                      disabled={isAnalyzing}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/30"
                    >
                      {isAnalyzing
                        ? "Generating Master Doc..."
                        : "Generate Master Doc"}
                    </button>
                  )}

                  {report && (
                    <button
                      onClick={triggerAnalysis}
                      disabled={isAnalyzing}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 border border-gray-600"
                    >
                      Regenerate
                    </button>
                  )}
                </div>
              </div>

              {isAnalyzing && (
                <div className="h-32 flex flex-col items-center justify-center text-gray-400 space-y-3 animate-pulse">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm">
                    Processing 13 chart segments and creating Master Document...
                  </p>
                </div>
              )}

              {report && (
                <div className="prose prose-invert max-w-none bg-black/40 p-8 rounded-xl border border-gray-800">
                  <div className="whitespace-pre-line text-gray-300 leading-relaxed font-light">
                    {report}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 bg-black/20 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          ZWDS Vision Segmenter &copy; 2025. Powered by React, Tailwind, and
          Gemini API.
        </div>
      </footer>
    </div>
  );
};

export default App;
