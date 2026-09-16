"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Trigger = "auto" | "scroll" | "click" | "hover";

/**
 * Adaptación del Falling Text de React Bits
 * (https://reactbits.dev/text-animations/falling-text): las palabras caen con
 * física (Matter.js). Sin el paquete de React Bits; respeta
 * prefers-reduced-motion (texto estático). Con trigger `hover`, el primer
 * pointermove/pointerdown en toda la ventana dispara la caída.
 */
export function FallingText({
  text,
  highlightWords = [],
  highlightClassName = "font-bold text-sprout",
  trigger = "auto",
  backgroundColor = "transparent",
  wireframes = false,
  gravity = 0.85,
  mouseConstraintStiffness = 0.2,
  fontSize = "1rem",
  className,
}: {
  text: string;
  highlightWords?: string[];
  highlightClassName?: string;
  trigger?: Trigger;
  backgroundColor?: string;
  wireframes?: boolean;
  gravity?: number;
  mouseConstraintStiffness?: number;
  fontSize?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [effectStarted, setEffectStarted] = useState(false);
  const reduceMotion = useReducedMotion();

  const words = text.split(" ").filter(Boolean);

  useEffect(() => {
    if (reduceMotion) return;
    if (trigger === "auto") {
      // Un frame para que el layout centrado ya tenga medidas reales.
      const id = requestAnimationFrame(() => setEffectStarted(true));
      return () => cancelAnimationFrame(id);
    }
    if (trigger === "scroll" && containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setEffectStarted(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
    // hover: primer movimiento (o toque) en cualquier parte de la pantalla.
    if (trigger === "hover") {
      const start = () => setEffectStarted(true);
      window.addEventListener("pointermove", start, { once: true });
      window.addEventListener("pointerdown", start, { once: true });
      return () => {
        window.removeEventListener("pointermove", start);
        window.removeEventListener("pointerdown", start);
      };
    }
  }, [trigger, reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !effectStarted) return;
    if (!containerRef.current || !canvasContainerRef.current || !textRef.current) {
      return;
    }

    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint, Body } =
      Matter;

    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    if (width <= 0 || height <= 0) return;

    const engine = Engine.create();
    engine.world.gravity.y = gravity;

    const render = Render.create({
      element: canvasContainerRef.current,
      engine,
      options: {
        width,
        height,
        background: backgroundColor,
        wireframes,
      },
    });

    // Paredes al borde (finas): las palabras pueden llegar a izquierda y derecha.
    const wall = 8;
    const boundaryOptions = {
      isStatic: true,
      render: { fillStyle: "transparent" },
    };
    const floor = Bodies.rectangle(
      width / 2,
      height + wall / 2,
      width + wall * 4,
      wall,
      boundaryOptions,
    );
    const leftWall = Bodies.rectangle(
      -wall / 2,
      height / 2,
      wall,
      height * 2,
      boundaryOptions,
    );
    const rightWall = Bodies.rectangle(
      width + wall / 2,
      height / 2,
      wall,
      height * 2,
      boundaryOptions,
    );
    const ceiling = Bodies.rectangle(
      width / 2,
      -wall / 2,
      width + wall * 4,
      wall,
      boundaryOptions,
    );

    const wordSpans = textRef.current.querySelectorAll<HTMLElement>("span[data-word]");
    const wordBodies = [...wordSpans].map((elem) => {
      const rect = elem.getBoundingClientRect();
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;

      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        render: { fillStyle: "transparent" },
        restitution: 0.55,
        frictionAir: 0.02,
        friction: 0.25,
      });
      Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.2) * 2,
      });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

      return { elem, body };
    });

    wordBodies.forEach(({ elem, body }) => {
      elem.style.position = "absolute";
      elem.style.left = `${body.position.x}px`;
      elem.style.top = `${body.position.y}px`;
      elem.style.transform = "translate(-50%, -50%)";
    });

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: mouseConstraintStiffness,
        render: { visible: false },
      },
    });
    render.mouse = mouse;
    // Evita que la rueda del mouse scrollee / zoomee el canvas.
    const matterMouse = mouse as Matter.Mouse & {
      mousewheel: EventListener;
    };
    mouse.element.removeEventListener("mousewheel", matterMouse.mousewheel);
    mouse.element.removeEventListener("DOMMouseScroll", matterMouse.mousewheel);

    World.add(engine.world, [
      floor,
      leftWall,
      rightWall,
      ceiling,
      mouseConstraint,
      ...wordBodies.map((wb) => wb.body),
    ]);

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    let raf = 0;
    const updateLoop = () => {
      wordBodies.forEach(({ body, elem }) => {
        const { x, y } = body.position;
        elem.style.left = `${x}px`;
        elem.style.top = `${y}px`;
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
      Engine.update(engine);
      raf = requestAnimationFrame(updateLoop);
    };
    updateLoop();

    const canvasContainer = canvasContainerRef.current;
    return () => {
      cancelAnimationFrame(raf);
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas && canvasContainer?.contains(render.canvas)) {
        canvasContainer.removeChild(render.canvas);
      }
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, [
    effectStarted,
    gravity,
    wireframes,
    backgroundColor,
    mouseConstraintStiffness,
    reduceMotion,
  ]);

  function startEffect() {
    if (!effectStarted && (trigger === "click" || trigger === "hover")) {
      setEffectStarted(true);
    }
  }

  if (reduceMotion) {
    return (
      <p
        className={cn("w-full px-4 text-center sm:px-6", className)}
        style={{ fontSize, lineHeight: 1.35 }}
      >
        {words.map((word, i) => {
          const highlighted = highlightWords.some((hw) => word.startsWith(hw));
          return (
            <span key={`${word}-${i}`}>
              {i > 0 ? " " : null}
              <span className={highlighted ? highlightClassName : undefined}>
                {word}
              </span>
            </span>
          );
        })}
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative z-1 h-full w-full overflow-hidden text-center",
        effectStarted ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        className,
      )}
      onClick={trigger === "click" ? startEffect : undefined}
    >
      {/* inset-0 = física full screen; nube baja y bien abierta a lo ancho. */}
      <div
        ref={textRef}
        className="pointer-events-none absolute inset-0 z-10 flex items-end justify-center px-2 pb-[4vh] pt-6 sm:px-4 sm:pb-[16vh]"
      >
        <div
          className="w-full max-w-none text-center"
          style={{ fontSize, lineHeight: 1.65 }}
        >
          {words.map((word, i) => {
            const highlighted = highlightWords.some((hw) => word.startsWith(hw));
            return (
              <span
                key={`${word}-${i}`}
                data-word
                className={cn(
                  "mx-[0.25em] inline-block select-none sm:mx-[0.5em]",
                  highlighted && highlightClassName,
                )}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
      {/* Canvas encima (transparente) para que Matter reciba el drag. */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
