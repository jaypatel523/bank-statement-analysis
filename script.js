// Configure this to your real API endpoint
// For local development, point to the backend running on your machine. You can also use a relative
// path ("/convert") if you serve frontend and backend from the same origin.
const API_URL = "https://bank-statement-analysis-backend.onrender.com/convert"; // <-- replace with real endpoint

const form = document.getElementById("upload-form");
const bankInput = document.getElementById("bank");
const fileInput = document.getElementById("pdf");
const fileName = document.getElementById("file-name");
const fileButton = document.querySelector(".file-button");
const statusEl = document.getElementById("status");
const spinner = document.getElementById("spinner");
const submitBtn = document.getElementById("submit-btn");
const downloadLink = document.getElementById("download-link");
const pdfPasswordRadios = document.querySelectorAll(
  'input[name="pdf-password"]'
);
const passwordInput = document.getElementById("pdf-pass");

fileInput.addEventListener("change", () => {
  const f = fileInput.files[0];
  if (!f) {
    fileName.textContent = "No file chosen";
    if (fileButton) fileButton.textContent = "Choose PDF";
    return;
  }
  fileName.textContent = f.name;
  if (fileButton) fileButton.textContent = "Change PDF";
});

// make file-name clickable and support keyboard activation on the label/button
fileName.addEventListener("click", () => fileInput.click());
if (fileButton) {
  fileButton.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });
}
// password radio logic: enable/disable password input
if (pdfPasswordRadios && passwordInput) {
  pdfPasswordRadios.forEach((r) =>
    r.addEventListener("change", () => {
      const yes =
        document.querySelector('input[name="pdf-password"]:checked').value ===
        "yes";
      passwordInput.disabled = !yes;
      passwordInput.required = yes;
      if (!yes) passwordInput.value = "";
    })
  );
}
function showStatus(text, isError = false) {
  statusEl.textContent = text;
  // use CSS variables for theme-safe colors
  statusEl.style.color = isError ? "var(--danger)" : "var(--success)";
}

function setLoading(on) {
  spinner.classList.toggle("hidden", !on);
  submitBtn.disabled = on;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";
  downloadLink.classList.add("hidden");

  const bank = bankInput.value.trim();
  const f = fileInput.files[0];

  if (!bank) {
    showStatus("Please select a bank.", true);
    return;
  }
  if (!f) {
    showStatus("Please choose a PDF file to upload.", true);
    return;
  }
  if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
    showStatus("Only PDF files are allowed.", true);
    return;
  }

  const fd = new FormData();
  fd.append("bank", bank);
  fd.append("pdf", f, f.name);
  // include password when provided
  if (passwordInput && !passwordInput.disabled) {
    const passVal = (passwordInput.value || "").trim();
    if (!passVal) {
      showStatus("Please enter the PDF password.", true);
      setLoading(false);
      return;
    }
    fd.append("password", passVal);
  }

  setLoading(true);
  showStatus("Uploading and converting…");

  try {
    if (!API_URL || API_URL.includes("your-api.example.com")) {
      // Demo fallback when API not configured — create a tiny CSV locally
      await new Promise((r) => setTimeout(r, 900));
      const sampleCsv =
        "date,desc,amount\n2025-01-01,Salary,1000\n2025-01-02,Coffee,-3.5\n";
      downloadBlob(sampleCsv, "result.csv", "text/csv");
      showStatus(
        "Demo CSV created (configure API_URL in script.js to call real API)."
      );
    } else {
      const resp = await fetch(API_URL, { method: "POST", body: fd });
      if (!resp.ok) throw new Error(`Server error: ${resp.status}`);

      const contentType = resp.headers.get("Content-Type") || "";
      const blob = await resp.blob();

      if (contentType.includes("application/json")) {
        // Some APIs may return JSON with CSV in a field (rare). Try to parse.
        const txt = await blob.text();
        try {
          const j = JSON.parse(txt);
          if (j.csv) {
            downloadBlob(j.csv, j.filename || "result.csv", "text/csv");
          } else {
            showStatus(
              "API returned JSON but no CSV found in `csv` property.",
              true
            );
          }
        } catch (err) {
          showStatus("Failed to parse JSON from server.", true);
        }
      } else {
        // Assume blob is CSV or file-like
        const disposition = resp.headers.get("Content-Disposition") || "";
        let filename = "result.csv";
        const m = disposition.match(
          /filename\*=UTF-8''(.+)$|filename="?([^";]+)"?/i
        );
        if (m) filename = decodeURIComponent(m[1] || m[2]);
        downloadBlob(blob, filename, contentType || "text/csv");
        showStatus("CSV ready — downloaded from server. ✅");
      }
    }
  } catch (err) {
    console.error(err);
    showStatus(err.message || "Upload failed.", true);
  } finally {
    setLoading(false);
  }
});

function downloadBlob(data, filename, mime) {
  let blob;
  if (typeof data === "string") blob = new Blob([data], { type: mime });
  else blob = data;
  const url = URL.createObjectURL(blob);
  downloadLink.href = url;
  downloadLink.download = filename;
  downloadLink.classList.remove("hidden");
  downloadLink.textContent = `Download ${filename}`;
  // auto-click to prompt download
  downloadLink.click();
  // release URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
