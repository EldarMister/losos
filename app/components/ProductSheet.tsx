"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";

type ProductSheetProps = {
  className: string;
  onClose: () => void;
  children: ReactNode;
};

type SheetGesture = {
  source: "touch" | "pointer";
  pointerId?: number;
  startX: number;
  startY: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  dragging: boolean;
  canExpand: boolean;
  expanded: boolean;
};

const interactiveSelector = "button, a, input, select, textarea, label, [role='button'], [contenteditable='true'], [data-sheet-no-drag]";

export function ProductSheet({ className, onClose, children }: ProductSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const expandedRef = useRef(false);
  const closingRef = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => { expandedRef.current = expanded; }, [expanded]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    let gesture: SheetGesture | null = null;
    let closeTimer: number | undefined;
    const mobile = () => window.matchMedia("(max-width: 720px)").matches;

    const releasePointer = (current: SheetGesture | null) => {
      if (current?.pointerId !== undefined && scroll.hasPointerCapture(current.pointerId)) {
        scroll.releasePointerCapture(current.pointerId);
      }
    };

    const cancel = () => {
      const current = gesture;
      if (!current) return;
      gesture = null;
      releasePointer(current);
      setDragging(false);
      setOffset(0);
    };

    const start = (event: Event, x: number, y: number, source: SheetGesture["source"], pointerId?: number) => {
      if (!mobile() || closingRef.current || gesture) return;
      const target = event.target instanceof Element ? event.target : null;
      if (scroll.scrollTop > 0 || target?.closest(interactiveSelector)) return;
      gesture = {
        source,
        pointerId,
        startX: x,
        startY: y,
        lastY: y,
        lastTime: performance.now(),
        velocity: 0,
        dragging: false,
        canExpand: Boolean(target?.closest(".modal-art")),
        expanded: expandedRef.current,
      };
      if (pointerId !== undefined) scroll.setPointerCapture(pointerId);
    };

    const move = (event: TouchEvent | PointerEvent, x: number, y: number) => {
      const current = gesture;
      if (!current) return;
      const dx = x - current.startX;
      const dy = y - current.startY;
      if (!current.dragging) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
        if (Math.abs(dx) > Math.abs(dy) || (dy < 0 && (!current.canExpand || current.expanded))) {
          cancel();
          return;
        }
        current.dragging = true;
        setDragging(true);
      }
      if (event.cancelable) event.preventDefault();
      const now = performance.now();
      current.velocity = (y - current.lastY) / Math.max(1, now - current.lastTime);
      current.lastY = y;
      current.lastTime = now;
      setOffset(dy >= 0 ? dy : Math.max(current.expanded ? -8 : -30, dy));
    };

    const finish = (event: TouchEvent | PointerEvent) => {
      const current = gesture;
      if (!current) return;
      gesture = null;
      releasePointer(current);
      if (!current.dragging) return;
      if (event.cancelable) event.preventDefault();
      setDragging(false);
      const distance = current.lastY - current.startY;
      const velocity = performance.now() - current.lastTime < 80 ? current.velocity : 0;
      if (distance > 100 || (distance > 40 && velocity > 0.55)) {
        closingRef.current = true;
        setClosing(true);
        setOffset(window.innerHeight + 40);
        closeTimer = window.setTimeout(() => closeRef.current(), 180);
        return;
      }
      if (distance < -16 && current.canExpand) {
        expandedRef.current = true;
        setExpanded(true);
      }
      setOffset(0);
    };

    const scrollTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) { cancel(); return; }
      const touch = event.touches[0];
      start(event, touch.clientX, touch.clientY, "touch");
    };
    const touchMove = (event: TouchEvent) => {
      if (gesture?.source !== "touch") return;
      if (event.touches.length !== 1) { cancel(); return; }
      const touch = event.touches[0];
      move(event, touch.clientX, touch.clientY);
    };
    const touchEnd = (event: TouchEvent) => {
      if (gesture?.source === "touch") finish(event);
    };
    const touchCancel = () => { if (gesture?.source === "touch") cancel(); };
    const pointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.button !== 0) return;
      start(event, event.clientX, event.clientY, "pointer", event.pointerId);
    };
    const pointerMove = (event: PointerEvent) => {
      if (gesture?.source === "pointer" && gesture.pointerId === event.pointerId) move(event, event.clientX, event.clientY);
    };
    const pointerUp = (event: PointerEvent) => {
      if (gesture?.source === "pointer" && gesture.pointerId === event.pointerId) finish(event);
    };
    const pointerCancel = (event: PointerEvent) => {
      if (gesture?.source === "pointer" && gesture.pointerId === event.pointerId) cancel();
    };
    const resize = () => { if (gesture) cancel(); };
    const options = { passive: false };
    const touchTargets: HTMLElement[] = [scroll];

    scroll.addEventListener("touchstart", scrollTouchStart, options);
    for (const element of touchTargets) {
      element.addEventListener("touchmove", touchMove, options);
      element.addEventListener("touchend", touchEnd, options);
      element.addEventListener("touchcancel", touchCancel, options);
    }
    scroll.addEventListener("pointerdown", pointerDown);
    scroll.addEventListener("pointermove", pointerMove);
    scroll.addEventListener("pointerup", pointerUp);
    scroll.addEventListener("pointercancel", pointerCancel);
    scroll.addEventListener("lostpointercapture", pointerCancel);
    window.addEventListener("resize", resize);

    return () => {
      const current = gesture;
      gesture = null;
      releasePointer(current);
      if (closeTimer !== undefined) window.clearTimeout(closeTimer);
      scroll.removeEventListener("touchstart", scrollTouchStart);
      for (const element of touchTargets) {
        element.removeEventListener("touchmove", touchMove);
        element.removeEventListener("touchend", touchEnd);
        element.removeEventListener("touchcancel", touchCancel);
      }
      scroll.removeEventListener("pointerdown", pointerDown);
      scroll.removeEventListener("pointermove", pointerMove);
      scroll.removeEventListener("pointerup", pointerUp);
      scroll.removeEventListener("pointercancel", pointerCancel);
      scroll.removeEventListener("lostpointercapture", pointerCancel);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const style = { "--product-sheet-offset": `${offset}px` } as CSSProperties;

  return (
    <div className={[className, expanded && "sheet-expanded", dragging && "sheet-dragging", closing && "sheet-closing"].filter(Boolean).join(" ")} style={style} inert={closing}>
      <div ref={scrollRef} className="product-sheet-scroll">{children}</div>
    </div>
  );
}
