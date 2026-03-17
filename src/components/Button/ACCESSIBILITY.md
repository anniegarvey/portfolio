# Button Accessibility

## Loading state

### The problem with `disabled`

Using the native `disabled` attribute for a loading state has two issues:

1. **Removes the button from the tab order.** A keyboard user tabs past it entirely and cannot discover it or read its state.
2. **Communicates nothing about why.** Screen readers announce "dimmed" or "unavailable" (wording varies by SR and OS) but give no indication that the action is temporarily in progress rather than permanently unavailable.

### The solution: `aria-disabled` + `aria-labelledby` composition

For loading states, the component uses `aria-disabled="true"` instead of native `disabled`. This keeps the button focusable while communicating unavailability to assistive technology.

The accessible name is composed via `aria-labelledby` pointing to two hidden spans — one holding the original children, one holding the word "loading" — so a screen reader announces:

> **"Save, loading, button"**

```html
<button
  aria-disabled="true"
  aria-labelledby="label-id status-id"
  type="button"
>
  <span id="label-id" class="sr-only">Save</span>
  <svg aria-hidden="true"><!-- spinner --></svg>
  <span id="status-id" class="sr-only">loading</span>
</button>
```

Because `aria-disabled` does not prevent clicks at the browser level, the component manually sets `onClick` to `undefined` during loading.

### Why not mutate `aria-label` directly?

Changing `aria-label` from `"Save"` to `"Save, loading"` on re-render causes some screen readers to re-announce the button name, which can be disruptive. The `aria-labelledby` composition approach avoids this.

### Why not `aria-busy`?

`aria-busy` is designed for live region containers — it suppresses announcements of intermediate changes until the region finishes updating. Screen readers do not reliably announce `aria-busy` as a distinct state when it appears on a `button` element. It is not used here.

### `disabled` prop

The explicit `disabled` prop (for permanently unavailable actions) still uses native `disabled` and removes the button from the tab order. This is intentional: a button that is permanently disabled (e.g. a submit button on an invalid form) does not need to be discoverable via keyboard in the same way a temporarily loading button does.

## References

- [W3C APG Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [MDN: aria-disabled](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-disabled)
- [MDN: aria-busy](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-busy)
- [React Aria — pending button implementation](https://react-spectrum.adobe.com/react-aria/Button.html)
