import { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  children: ReactNode;
  subtitle?: string;
};

export function SectionCard({ title, subtitle, children }: SectionCardProps) {
  return (
    <section className="card">
      <h3 style={{ margin: 0 }}>{title}</h3>
      {subtitle ? <p style={{ opacity: 0.75 }}>{subtitle}</p> : null}
      {children}
    </section>
  );
}
