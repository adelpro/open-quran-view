# Responsive Sizing in OpenQuranView

This guide explains the responsive sizing strategy used in `OpenQuranView` to handle dynamic container dimensions while maintaining proper aspect ratio and readable typography.

## Dimension Behavior

The `width` and `height` props are **optional**. The component has three sizing modes:

### No dimensions provided

The component uses a `ResizeObserver` to measure the actual container element's width, then derives height using the mushaf ratio:

```tsx
const MUSHAF_RATIO = 0.7; // width / height

const containerHeight = containerWidth / MUSHAF_RATIO;
```

There are **no hardcoded default values** — the component fills whatever space is available in the parent container.

### Only width provided

- Width is used directly
- Height is derived: `height = width / MUSHAF_RATIO`

**Example:** `width={700}` → `height = 700 / 0.7 = 1000`

### Only height provided

- Height is used directly
- Width is derived: `width = height * MUSHAF_RATIO`

**Example:** `height={600}` → `width = 600 * 0.7 = 420`

### Both width and height provided

Both values are used **as-is** — the ratio is ignored and you can use any custom dimensions.

**Example:** `width={700} height={400}` → component renders at exactly `700×400`

## Mushaf Aspect Ratio

The `MUSHAF_RATIO = 0.7` constant encodes the width-to-height ratio of the standard Al-Madinah Mushaf medium edition (~14×20 cm). This preserves the authentic mushaf proportions:

```
┌─────────────────────────────────────────────────┐
│  Input           │  Behavior                    │
├──────────────────┼──────────────────────────────┤
│  Neither w nor h │  Measure container, derive h │
│  Only width      │  Use width, derive height    │
│  Only height     │  Use height, derive width    │
│  Both w and h    │  Use both as-is (no ratio)   │
└─────────────────────────────────────────────────┘
```

This approach ensures that:

- The Quran page maintains its correct proportions regardless of screen size
- Width is the primary control dimension (determined by parent container or ResizeObserver)
- Height is automatically calculated to preserve the aspect ratio when only one dimension is provided

## Clamp Utility Function

A simple utility function enforces minimum and maximum bounds on values:

```tsx
const clamp = (min: number, val: number, max: number) =>
  Math.max(min, Math.min(val, max));
```

This ensures:
- Values never fall below the minimum threshold
- Values never exceed the maximum threshold
- The result is always within the defined range [min, max]

## Dynamic Font Sizing

Font sizes are calculated as percentages of the container width, then constrained to readable bounds:

### Surah Header Font

```tsx
const fontSizeSurahHeader = clamp(24, containerWidth * 0.07, 64);
```

| Container Width | Calculation | Result |
|-----------------|-------------|--------|
| 300px | clamp(24, 21, 64) | 24px |
| 600px | clamp(24, 42, 64) | 42px |
| 1000px | clamp(24, 70, 64) | 64px |

### Word Font

```tsx
const fontSizeWord = clamp(20, containerWidth * 0.035, 32);
```

| Container Width | Calculation | Result |
|-----------------|-------------|--------|
| 300px | clamp(20, 10.5, 32) | 20px |
| 600px | clamp(20, 21, 32) | 21px |
| 1000px | clamp(20, 35, 32) | 32px |

## Why This Approach Works

1. **Proportional scaling**: Fonts scale naturally with container size, maintaining visual hierarchy
2. **Readable bounds**: Minimum sizes ensure text remains legible on small screens
3. **Maximum constraints**: Maximum sizes prevent oversized text on very large screens
4. **Single source of truth**: Width drives all other measurements, simplifying responsiveness

## ResizeObserver Integration

The component uses a `ResizeObserver` to track container width changes:

```tsx
useEffect(() => {
  if (!containerRef.current) return;

  const updateWidth = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect?.width) setContainerWidth(rect.width);
  };

  updateWidth();

  const resizeObserver = new ResizeObserver(() => {
    updateWidth();
  });

  resizeObserver.observe(containerRef.current);

  return () => resizeObserver.disconnect();
}, []);
```

This enables:
- Automatic recalculation when container resizes
- Support for responsive parent layouts
- No manual window resize handling required
