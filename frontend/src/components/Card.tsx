import { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
};

export default function Card({ title, children }: CardProps) {
  return (
    <section className="card">
      {title ? <h3 className="section-title">{title}</h3> : null}
      {children}
    </section>
  );
}
