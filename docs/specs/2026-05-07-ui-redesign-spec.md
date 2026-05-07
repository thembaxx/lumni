# UI Redesign Specification

## Date: 2026-05-07
## Project: Lumni Web App UI Enhancement
## Status: Approved

---

## 1. Overview

Redesign the Lumni web application UI to create a unique, clean, functional interface with mobile-first experience, beautiful animations using Framer Motion, and improved light/dark themes.

---

## 2. Design Direction

- **Aesthetic**: Clean, modern "study companion" feel - refined and purposeful
- **Navigation**: Bottom tab bar for mobile-first experience
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Theme**: Rich, intentional color palettes for light and dark modes

---

## 3. Navigation & Layout

### 3.1 Bottom Navigation Bar

Replace the hamburger drawer menu with a fixed bottom navigation bar.

**Tab Structure:**
- Home (dashboard icon)
- Quiz (practice icon)
- Flashcards (cards icon)
- Upload (add icon)
- Settings (gear icon)

**Behavior:**
- Fixed position at bottom of viewport
- Active tab highlighted with animated indicator
- Safe area padding for device notches (env(safe-area-inset-bottom))
- 5 tabs, equal width distribution
- Min touch target: 48x48px
- Subtle slide-up animation on page load

### 3.2 Page Structure

- Remove top header navigation (hamburger menu)
- Content flows naturally from top
- Bottom nav always visible on mobile
- Hide bottom nav on desktop (breakpoint: 768px)

---

## 4. Visual Design

### 4.1 Color Palette

#### Light Theme
```
--background: oklch(98% 0.015 250)
--foreground: oklch(20% 0.02 250)
--card: oklch(100% 0 0)
--card-foreground: oklch(15% 0.02 250)
--primary: oklch(55% 0.15 250)
--primary-foreground: oklch(100% 0 0)
--secondary: oklch(96% 0.02 250)
--secondary-foreground: oklch(30% 0.02 250)
--accent: oklch(92% 0.03 150)
--accent-foreground: oklch(35% 0.05 150)
--muted: oklch(94% 0.02 250)
--muted-foreground: oklch(55% 0.02 250)
--border: oklch(85% 0.02 250)
--success: oklch(65% 0.12 150)
--warning: oklch(75% 0.12 45)
--error: oklch(60% 0.18 25)
--radius: 1rem
```

#### Dark Theme
```
--background: oklch(12% 0.015 250)
--foreground: oklch(95% 0.01 250)
--card: oklch(18% 0.02 250)
--card-foreground: oklch(95% 0.01 250)
--primary: oklch(70% 0.15 250)
--primary-foreground: oklch(15% 0.02 250)
--secondary: oklch(22% 0.02 250)
--secondary-foreground: oklch(90% 0.01 250)
--accent: oklch(25% 0.03 150)
--accent-foreground: oklch(80% 0.03 150)
--muted: oklch(25% 0.02 250)
--muted-foreground: oklch(65% 0.02 250)
--border: oklch(30% 0.02 250)
--success: oklch(70% 0.15 150)
--warning: oklch(80% 0.12 45)
--error: oklch(65% 0.18 25)
--radius: 1rem
--glow-primary: oklch(70% 0.15 250 / 15%)
```

### 4.2 Typography

- **Display Font**: Geist (already in use, refine usage)
- **Font Sizes** (rem-based, mobile-first):
  - xs: 0.75rem
  - sm: 0.875rem
  - base: 1rem
  - lg: 1.125rem
  - xl: 1.25rem
  - 2xl: 1.5rem
  - 3xl: 1.875rem
  - 4xl: 2.25rem

### 4.3 Spacing System

- Base unit: 4px
- Scale: 1(4px), 2(8px), 3(12px), 4(16px), 5(20px), 6(24px), 8(32px), 10(40px), 12(48px)

### 4.4 Card Design

- Border radius: 1rem (16px)
- Subtle shadow: 0 1px 3px oklch(0 0 0 / 0.1)
- Padding: 1.25rem (20px)
- Hover: slight elevation increase, subtle scale (1.01)

---

## 5. Animations (Framer Motion)

### 5.1 Page Transitions

- **Enter**: Fade + slide up (y: 20 → 0, opacity: 0 → 1)
- **Exit**: Fade + slide down (y: 0 → -10, opacity: 1 → 0)
- Duration: 300ms
- Ease: [0.25, 1, 0.5, 1] (custom quart ease)

### 5.2 Staggered Reveals

- Container: staggerChildren: 0.05s
- Children: fadeInUp (y: 16 → 0)
- Used in: card lists, quick actions, tab content

### 5.3 Micro-interactions

- **Buttons**: Scale on press (0.97), subtle bounce on release
- **Cards**: Lift on hover (translateY: -2px, shadow increase)
- **Tab indicator**: Smooth slide with spring physics
- **Loading**: Skeleton shimmer animation

### 5.4 Component Animations

- **Bottom Nav**: Slide up on mount, tab switch with indicator slide
- **Quiz cards**: Flip animation for flashcard reveal
- **Progress**: Animated progress bar fill
- **Success/Error**: Checkmark/X animation with particle burst

---

## 6. Mobile-First Improvements

### 6.1 Touch Targets
- Minimum: 44x44px (iOS guideline)
- Comfortable: 48x48px
- Icon buttons: 44px minimum

### 6.2 Layout Adjustments
- Bottom nav height: 64px + safe area
- Content padding: 16px horizontal
- Card gap: 12px
- Section gap: 24px

### 6.3 Scroll Behavior
- Native scroll with momentum
- Pull-to-refresh on dashboard
- Smooth scroll anchor links

### 6.4 Keyboard Handling
- Input focus scrolls into view
- Bottom nav hides when keyboard open

---

## 7. Implementation Plan

### Phase 1: Foundation
1. Create bottom navigation component
2. Update theme colors in globals.css
3. Add Framer Motion layout animations

### Phase 2: Navigation
4. Replace Menu component with BottomNav
5. Update pages to use new navigation
6. Add responsive hiding (desktop hide, mobile show)

### Phase 3: Enhancements
7. Add page transition animations
8. Staggered list reveals
9. Micro-interaction improvements

### Phase 4: Polish
10. Review and fix edge cases
11. Test on real devices
12. Performance optimization

---

## 8. Success Criteria

- [ ] Bottom navigation works on mobile
- [ ] Navigation hidden on desktop (>768px)
- [ ] Light theme colors updated
- [ ] Dark theme colors updated with glow effects
- [ ] Page transitions are smooth
- [ ] Staggered reveals on dashboard
- [ ] Touch targets are 44px+
- [ ] All interactive elements have animations
- [ ] No layout shifts on navigation
- [ ] Accessible (keyboard, screen reader)