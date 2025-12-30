# Bank PDF → CSV (frontend)

Small static frontend that provides a clean form to select a bank and upload a PDF statement. On submit it posts the PDF + bank to an API and downloads the returned CSV.

## Files

- `index.html` — main page
- `styles.css` — simple, modern styling
- `script.js` — validation, API call, and CSV download handling

## Setup

1. Put the files on any static server (or open via `python -m http.server 8000` for local testing).
2. Edit `script.js` and set `API_URL` to your real conversion endpoint.

## Expected API contract

- POST /convert (or your path)
- Form fields:
  - `bank` — string
  - `pdf` — file (PDF)
  - `password` — optional string (include when PDF is password-protected)
- Response:
  - Best: return CSV as file blob (Content-Type: text/csv) and optionally `Content-Disposition` header for filename
  - Alternative: JSON with key `csv` containing CSV text

## Notes

- CORS: ensure the API allows cross-origin requests from your site
- Mobile friendly: responsive layout, touch-friendly buttons, and an improved file picker for phones and tablets.
- When `API_URL` is left as the demo placeholder, the UI will generate a small demo CSV locally so you can test the flow.

Enjoy! ✅
