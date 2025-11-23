# 🚀 CarouMate Development Roadmap & Technical Documentation

Dokumen ini berfungsi sebagai panduan bagi pengembang (developer) untuk memahami arsitektur saat ini, melakukan refactoring kode, dan mengimplementasikan fitur-fitur masa depan untuk CarouMate.

---

## 🛠️ Tech Stack Saat Ini

*   **Frontend Library:** React 18+
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (dengan konfigurasi Dark Mode & Custom Fonts)
*   **Build Tool:** Vite (Diasumsikan berdasarkan penggunaan `esm.sh` dan struktur modern) / Create React App
*   **Backend / Database:** Supabase (PostgreSQL, Auth, RLS)
*   **AI Integration:** Google Gemini API (Flash 2.5, Pro 3.0, Imagen, Veo)
*   **Export Tools:** html2canvas, jspdf, jszip
*   **State Management:** React `useState` & `useEffect` (Lokal) + Supabase (Remote)

---

## ⚠️ Prioritas 1: Refactoring & Optimasi Arsitektur

Saat ini, sebagian besar logika aplikasi terpusat di `App.tsx`. Untuk skala yang lebih besar, refactoring sangat mendesak.

### 1. Migrasi Routing
*   **Kondisi Saat Ini:** Menggunakan `window.history.pushState` dan conditional rendering manual berdasarkan state `view`.
*   **Rencana:** Migrasi ke **React Router DOM (v6+)**.
    *   Memungkinkan *nested routes* (misal: `/dashboard/settings`).
    *   Penanganan *Protected Route* yang lebih baik untuk user yang belum login.
    *   Manajemen *History* browser yang lebih natural.

### 2. State Management Global
*   **Kondisi Saat Ini:** State user, history, dan settings dikelola di `App.tsx` dan di-pass via props (Prop Drilling).
*   **Rencana:** Implementasi **Zustand** atau **Redux Toolkit**.
    *   `useAuthStore`: Menyimpan sesi user dan profil.
    *   `useCarouselStore`: Menyimpan data carousel yang sedang diedit (mencegah re-render `App.tsx` saat mengetik satu huruf).
    *   `useSettingsStore`: Menyimpan preferensi global dan API Key.

### 3. Keamanan API Key (Backend Proxy)
*   **Kondisi Saat Ini:** API Key disimpan di `localStorage` user dan dipanggil langsung dari browser (Client-side). Ini berisiko jika user ingin menggunakan kunci API milik platform (SaaS mode).
*   **Rencana:** Fungsikan folder `server/` sepenuhnya.
    *   Frontend memanggil endpoint `https://api.caroumate.com/generate`.
    *   Backend (Node.js/Express atau Supabase Edge Functions) yang memanggil Google Gemini.
    *   Ini memungkinkan penerapan *Rate Limiting* dan menyembunyikan API Key master jika nanti beralih ke model berbayar.

---

## 🌟 Prioritas 2: Pengembangan Fitur Baru (Roadmap)

### 1. Advanced Editor (Canvas System)
Saat ini editor bersifat statis (kolom input teks). Target selanjutnya adalah editor visual _Drag-and-Drop_.
*   **Fitur:**
    *   Drag elemen teks/gambar bebas di dalam slide.
    *   Resize elemen visual.
    *   Layering (Z-Index control).
*   **Library:** Integrasikan `dnd-kit` atau `react-moveable`.

### 2. Sistem Template Visual
Saat ini gaya desain (`DesignPreferences`) di-hardcode dalam logika CSS.
*   **Rencana:** Buat sistem template berbasis JSON.
    *   User bisa memilih layout: "Split Image", "Big Typography", "Chart Focus".
    *   Menyimpan template custom user ke database.

### 3. Kolaborasi Tim (Real-time)
*   **Fitur:** Mengizinkan beberapa user mengedit carousel yang sama.
*   **Teknis:** Gunakan **Supabase Realtime** (Broadcast & Presence) untuk menyinkronkan kursor dan perubahan teks antar user.

### 4. Integrasi Media Sosial Langsung
*   **Fitur:** Tombol "Post to Instagram/LinkedIn" langsung dari dashboard.
*   **Teknis:** Menggunakan API Meta Graph dan LinkedIn API. Memerlukan backend server untuk OAuth token management.

### 5. Monetisasi (SaaS)
*   **Fitur:** Batasi jumlah generasi AI untuk user gratis.
*   **Teknis:**
    *   Integrasi **Stripe** atau **LemonSqueezy**.
    *   Tambahkan kolom `credits` pada tabel `profiles` di Supabase.
    *   Kurangi kredit setiap kali API dipanggil via Backend Proxy.

---

## 📂 Struktur Database (Supabase SQL Updates)

Untuk mendukung fitur di atas, skema database perlu diperbarui:

```sql
-- Tambahan untuk fitur Template
create table public.templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  layout_config jsonb not null, -- Posisi elemen x,y
  is_public boolean default false,
  created_by uuid references public.profiles(id)
);

-- Tambahan untuk Kolaborasi
create table public.collaborators (
  carousel_id uuid references public.carousels(id),
  user_id uuid references public.profiles(id),
  role text check (role in ('editor', 'viewer')),
  primary key (carousel_id, user_id)
);
```

---

## 🐛 Known Issues & Debugging

1.  **Mobile Scrolling:** Isu scrolling pada mobile sering terjadi karena konflik `overflow: hidden` pada layout flexbox. Pastikan untuk selalu cek class `.overflow-y-auto` pada container utama.
2.  **HTML2Canvas Rendering:** Kadang hasil download berbeda dengan preview (terutama border-radius atau shadow).
    *   *Solusi:* Gunakan opsi `scale` yang dikalkulasi dinamis (seperti yang sudah diterapkan di `App.tsx` versi terakhir) dan pastikan font sudah ter-load sepenuhnya sebelum render.
3.  **Supabase RLS:** Jika data tidak muncul setelah login, cek kebijakan RLS (Row Level Security) di dashboard Supabase. Pastikan `SELECT` policy aktif untuk `auth.uid() = user_id`.

---

## 📦 Deployment Checklist

1.  **Environment Variables:**
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
2.  **Redirect URLs:**
    *   Pastikan URL produksi (misal: `https://caroumate.com`) terdaftar di Google Cloud Console (OAuth) dan Supabase Auth Settings.
3.  **Netlify/Vercel Config:**
    *   Pastikan file `vercel.json` atau `_redirects` ada untuk menangani routing SPA (redirect semua request ke `index.html`).

---

**Dibuat oleh:** Tim Pengembang CarouMate
**Terakhir Diperbarui:** 2025
