# Vornal - Fixes & Architecture Enhancement Plan

## Overview & User Requests Addressed

1. **GitHub Pages Deployment Issues**:
   - Provide direct client-side execution for static hosting.
   - Explain how GitHub Pages handles client-side routing, static assets, and Google OAuth domain restrictions.
2. **Missing 3-Line Hamburger Menu in Header**:
   - Remove clipping `overflow-hidden` container in the header.
   - Pin the 3-line `Menu` button with `shrink-0` priority so it never gets clipped or hidden on any tablet or mobile screen width.
   - Adapt "Login to save" button for small mobile screens.
3. **Options Menu Uniformity**:
   - Redesign all items in `SidebarDrawer` into a cohesive, uniform card design system (matching radius, consistent padding, standardized icon tiles, uniform typography, aligned switches and buttons).
4. **Clarification on "GitHub Pages" Option**:
   - Remove the confusing "GitHub Pages domain or custom Client ID setup" button from the main user menu.
   - Domain assistance will trigger contextually only if an OAuth domain whitelist error occurs.
5. **Tone Down Attribution**:
   - Remove "Ideated by Ravi Nair" from the header top bar, onboarding modal, and drawer footer.
   - Preserve full, thoughtful attribution exclusively inside the `About & Privacy` modal.
6. **Solid README.md on App Philosophy**:
   - Create a rich, comprehensive `README.md` at `/README.md` detailing the core philosophy of Vornal (somatic calming, local-first data sovereignty, audio preservation, structured markdown reflections, and seamless cloud syncing).
7. **Google API Credits & BYOK (Bring Your Own Key)**:
   - Provide a definitive explanation: On GitHub Pages, Native Speech is 100% free and client-side (uses zero credits).
   - Add a "Bring Your Own Key" (BYOK) Gemini setting so visitors who want AI summaries can enter their own free Gemini API key, ensuring the creator's credits are NEVER consumed by third-party users.

---

## Action Steps

1. **Client-Side Gemini Service (`src/utils/geminiClient.ts`)**:
   - Allow saving/retrieving user's own Gemini API key in `localStorage`.
   - Provide direct client-side multimodal synthesis for static GitHub Pages.
2. **Header Fixes & Attribution Removal (`src/App.tsx`)**:
   - Remove `overflow-hidden` so the 3-line hamburger menu button is always visible.
   - Remove "Ideated by Ravi Nair" from header and onboarding banner.
   - Retain credit in `AboutPrivacyModal.tsx`.
3. **Sidebar Drawer Uniformity (`src/components/SidebarDrawer.tsx`)**:
   - Standardize all section cards to uniform dimensions, padding, headers, and controls.
   - Remove the developer "GitHub Pages" link from the main drawer.
   - Add the BYOK Gemini API key card with secure local storage.
4. **Onboarding Modal Cleanup (`src/components/OnboardingModal.tsx`)**:
   - Remove attribution from onboarding dialog; keep it focused on choice.
5. **Philosophy & Setup Documentation (`/README.md`)**:
   - Create `/README.md` covering philosophy, features, privacy architecture, and GitHub Pages guide.
