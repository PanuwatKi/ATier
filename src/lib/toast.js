// Tiny framework-agnostic toast store (no context/prop-drilling needed).
let listeners = [];
let toasts = [];
let seq = 0;

function emit() {
  listeners.forEach((l) => l(toasts));
}

export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function getToasts() {
  return toasts;
}

export function dismiss(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function push(type, message, duration = 4500) {
  const id = ++seq;
  toasts = [...toasts, { id, type, message: String(message) }];
  emit();
  if (duration) setTimeout(() => dismiss(id), duration);
  return id;
}

export const toast = {
  success: (m, d) => push('success', m, d),
  error: (m, d) => push('error', m, d),
  info: (m, d) => push('info', m, d),
};
