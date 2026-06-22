# Motion System Specification

## Overview

Motion guidelines for lumni based on Disney's 12 principles of animation. These animations communicate purpose, guide attention, and create delightful interactions.

## Animation Timing Tokens

```css
:root {
  /* Durations */
  --duration-instant: 100ms; /* Micro-interactions, feedback */
  --duration-fast: 150ms; /* Hovers, toggles */
  --duration-normal: 200ms; /* Standard transitions */
  --duration-slow: 300ms; /* Modal/drawer reveals */
  --duration-page: 500ms; /* Page transitions */

  /* Easing Curves */
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1); /* Snappy deceleration */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1); /* Smooth deceleration */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1); /* Playful bounce */
}
```

## Keyframe Animations

### 1. Fade + Rise

**Purpose**: Staggered content reveals, page entry
**Principle**: Slow In/Slow Out, Staging

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Usage**: `animate-fade-in-up`
**Timing**: 300ms ease-out-quart

### 2. Scale + Fade

**Purpose**: Modal/dialog entry, card reveals
**Principle**: Anticipation, Slow In/Slow Out

```css
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

**Usage**: `animate-fade-in-scale`
**Timing**: 300ms ease-out-quart

### 3. Slide from Bottom

**Purpose**: Drawer/dialog reveals, sheet entries
**Principle**: Staging, Follow Through

```css
@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 4. Slide from Left/Right

**Purpose**: Navigation transitions, side drawers
**Principle**: Arc, Staging

```css
@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### 5. Icon Pop

**Purpose**: Button/icon interactions, success states
**Principle**: Squash & Stretch, Exaggeration

```css
@keyframes iconPop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
```

**Timing**: 150ms ease-out-expo

### 6. Breathe

**Purpose**: Loading indicators, attention cues
**Principle**: Slow In/Slow Out, Secondary Action

```css
@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}
```

**Timing**: 2s ease-in-out infinite

### 7. Checkmark

**Purpose**: Success confirmation, form validation
**Principle**: Exaggeration, Timing

```css
@keyframes checkmark {
  0% {
    transform: scale(0) rotate(-15deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(-15deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}
```

**Timing**: 400ms ease-out-expo

### 8. Shake

**Purpose**: Error feedback, attention
**Principle**: Timing, Exaggeration

```css
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-2px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(2px);
  }
}
```

**Timing**: 500ms ease-out-quart

## Component Motion Guidelines

### Button

| State        | Transform   | Timing  | Principle        |
| ------------ | ----------- | ------- | ---------------- |
| Hover        | scale(1.02) | 150ms   | Anticipation     |
| Active/Press | scale(0.97) | 100ms   | Squash & Stretch |
| Focus        | ring-offset | instant | Staging          |

```css
/* Example */
className="hover:scale-[1.02] active:scale-[0.97] transition-all duration-150 ease-out-quart"
```

### Card

| State  | Transform            | Timing | Principle        |
| ------ | -------------------- | ------ | ---------------- |
| Hover  | scale(1.01) + shadow | 200ms  | Secondary Action |
| Expand | height + opacity     | 300ms  | Anticipation     |

```css
/* Example */
className="hover:scale-[1.01] hover:shadow-lg transition-all duration-200 ease-out-quart"
```

### Dialog

| State   | Transform            | Timing | Principle                  |
| ------- | -------------------- | ------ | -------------------------- |
| Open    | scale(0.95→1) + fade | 300ms  | Anticipation + Slow In/Out |
| Close   | scale(1→0.95) + fade | 200ms  | Fast out                   |
| Overlay | fade                 | 200ms  | Staging                    |

```css
/* Open */
data-open:animate-in data-open:zoom-in-95 data-open:fade-in-0 data-open:duration-300

/* Close */
data-closed:animate-out data-closed:zoom-out-95 data-closed:fade-out-0 data-closed:duration-200
```

### Drawer

| State | Transform                 | Timing | Principle          |
| ----- | ------------------------- | ------ | ------------------ |
| Open  | translateY(100%→0) + fade | 300ms  | Anticipation + Arc |
| Close | translateY(0→100%) + fade | 200ms  | Fast out           |

```css
/* Bottom drawer */
data-open:slide-in-from-bottom data-open:duration-300 data-open:ease-out-quart
data-closed:slide-out-to-bottom data-closed:duration-200
```

## Staggered Reveals

Use animation-delay for staggered content:

```css
.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }
.delay-500 { animation-delay: 500ms; }

/* Example */
<div className="animate-fade-in-up delay-100">Content 1</div>
<div className="animate-fade-in-up delay-200">Content 2</div>
<div className="animate-fade-in-up delay-300">Content 3</div>
```

## Reduced Motion

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Animation Checklist

- [ ] Uses `--ease-out-quart` for snappy feel
- [ ] Hover states use `scale(1.01-1.02)` not just color
- [ ] Press/active states use `scale(0.97-0.98)`
- [ ] Dialog/drawer closes faster than opens
- [ ] Staggered delays: 100ms increments
- [ ] Icon animations: 150ms duration
- [ ] Page transitions: 300-500ms
- [ ] Reduced motion fallback provided
