import type { Ref } from 'vue'
import { onBeforeUnmount, ref, unref, watch } from 'vue'

import { isClient } from './helpers'

type EventTargetLike = Window | Document | HTMLElement | SVGElement | null
type MaybeElementRef
  = | EventTargetLike
    | Ref<EventTargetLike | undefined>
    | (() => EventTargetLike | undefined)

function resolveTarget(target: MaybeElementRef): EventTargetLike | undefined {
  return typeof target === 'function' ? target() : unref(target)
}

export function useEventListener<K extends keyof WindowEventMap>(
  event: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): () => void
export function useEventListener(
  target: MaybeElementRef,
  event: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions,
): () => void
export function useEventListener(
  targetOrEvent: MaybeElementRef | string,
  eventOrListener: string | EventListenerOrEventListenerObject,
  listenerOrOptions?: EventListenerOrEventListenerObject | boolean | AddEventListenerOptions,
  options?: boolean | AddEventListenerOptions,
) {
  const isTargetless = typeof targetOrEvent === 'string'
  const target = isTargetless ? ref(isClient ? window : undefined) : targetOrEvent
  const event = isTargetless ? targetOrEvent : (eventOrListener as string)
  const listener = isTargetless
    ? (eventOrListener as EventListenerOrEventListenerObject)
    : (listenerOrOptions as EventListenerOrEventListenerObject)
  const eventOptions = isTargetless
    ? (listenerOrOptions as boolean | AddEventListenerOptions | undefined)
    : options

  let cleanup: (() => void) | undefined

  const stopWatch = watch(
    () => resolveTarget(target as MaybeElementRef),
    (el, _, onCleanup) => {
      cleanup?.()
      cleanup = undefined

      if (!el?.addEventListener)
        return
      el.addEventListener(event, listener, eventOptions)
      cleanup = () => el.removeEventListener(event, listener, eventOptions)
      onCleanup(() => cleanup?.())
    },
    { immediate: true },
  )

  const stop = () => {
    cleanup?.()
    cleanup = undefined
    stopWatch()
  }

  onBeforeUnmount(stop)

  return stop
}

export function useResizeObserver(
  target: MaybeElementRef,
  callback: ResizeObserverCallback,
) {
  let observer: ResizeObserver | undefined

  const stopWatch = watch(
    () => resolveTarget(target),
    (el, _, onCleanup) => {
      observer?.disconnect()
      observer = undefined

      if (!el || typeof ResizeObserver === 'undefined')
        return
      observer = new ResizeObserver(callback)
      observer.observe(el as HTMLElement)
      onCleanup(() => observer?.disconnect())
    },
    { immediate: true },
  )

  const stop = () => {
    observer?.disconnect()
    observer = undefined
    stopWatch()
  }

  onBeforeUnmount(stop)

  return { stop }
}
