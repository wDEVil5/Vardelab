export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="rounded-full bg-electric/10 px-3 py-1 text-sm font-medium text-electric">
        Propuesta independiente · No oficial UNAB
      </span>
      <h1 className="text-4xl font-bold text-ink sm:text-5xl">CampusLab</h1>
      <p className="max-w-md text-muted">
        Microproyectos reales que conectan estudiantes con necesidades de
        organizaciones.
      </p>
      <p className="text-sm text-muted">
        Scaffold inicial · próximo hito: modelo de datos y políticas RLS.
      </p>
    </main>
  );
}
