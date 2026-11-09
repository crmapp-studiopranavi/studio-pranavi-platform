interface StubPageProps {
  title: string;
  phase: string;
}

export function StubPage({ title, phase }: StubPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This module will be implemented in {phase}.
      </p>
    </div>
  );
}
