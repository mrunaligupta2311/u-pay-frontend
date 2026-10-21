# U-Pay — UPI Wallet Frontend Demo

A mobile-first React + Vite frontend prototype inspired by common UPI wallet flows. It uses dummy data only and does **not** move real money.

## Requirements
- Node.js 18+
- pnpm (recommended) or npm

## Run locally
```bash
pnpm install
pnpm dev
```
Open the local URL printed by Vite (normally `http://localhost:5173`).

## Build
```bash
pnpm build
pnpm preview
```

## Included
- Home page with recipient search, UPI ID copy, personal QR modal, quick scanner action, recent contacts and transaction list.
- Send-money modal with contact search, recipient entry, amount validation, balance validation and simulated payment receipt.
- Transaction history with search, date filter and combined All / Sent / Received filters.
- UPI scanner with camera scan, QR image upload and best-effort torch toggle (device/browser dependent).
- Balance page with hide/show balance, remove-account confirmation, re-add bank and reset demo data.
- Profile page with editable name, locked mobile number, UPI copy and editable/addable bank name.
- Responsive five-tab bottom navigation.
- Every component has its own JSX and CSS file. Each page also has its own CSS file.
- Wallet data is persisted in browser `localStorage` so simulated sends and profile changes survive refresh.

## Important notes
- All transactions are simulated. No payment is sent to a bank or UPI network.
- The initial balance and initial transaction history are the supplied dummy data. The displayed starting balance is not recalculated from seeded historical transactions.
- Camera access typically requires `localhost` or HTTPS and user permission. Torch is supported only by some devices/browsers.
- The QR reader detects the decoded QR payload. It does not automatically send money from a scanned QR.
- Google Fonts is loaded from the internet; the app still works with system fonts if it cannot load.
- This is intentionally frontend-only. The wallet context is a clean place to later replace localStorage actions with API calls.
