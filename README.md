# uvia-backend

Funcții serverless pentru Uvia — infrastructură proprie, independentă.

## Ce face acum

Un singur endpoint: `POST /api/mannequin` — primește o poză (base64), o trimite la Gemini
(`gemini-2.5-flash-image`) cu promptul de transformare în manechin, întoarce imaginea generată.

Partea 2 (manechin → model 3D) urmează după ce se decide ce serviciu se folosește.

## Development local

```bash
npm install
npx vercel dev
```

Trebuie un fișier `.env.local` (vezi `.env.example`) cu `GEMINI_API_KEY` real.

## Deploy

1. Push pe `main` — Vercel face deploy automat, dacă repo-ul e conectat la un proiect Vercel.
2. În Vercel → Settings → Environment Variables, setează `GEMINI_API_KEY` și `ALLOWED_ORIGIN`.

## Apelare din frontend

```ts
const res = await fetch("https://<domeniul-vercel>/api/mannequin", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ image: base64Image }),
});
const { image } = await res.json();
```
