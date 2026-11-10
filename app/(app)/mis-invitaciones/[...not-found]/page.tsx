import { notFound } from "next/navigation";

/**
 * Catch-all de "no existe" para este segmento del área autenticada. Sin esto,
 * una URL mal escrita bajo esta sección no matchea ningún route y Next cae al
 * `app/not-found.tsx` del sitio público (saltándose el sidebar). Un catch-all
 * a nivel del grupo `(app)` no sirve: los route groups no aportan prefijo de
 * URL, así que capturaría 404 de TODO el sitio, no solo de esta sección — por
 * eso hay uno de estos por cada segmento de nivel superior en vez de uno solo.
 */
export default function CatchAll() {
  notFound();
}
