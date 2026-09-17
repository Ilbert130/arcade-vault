export default function ComingSoon({ title }: { title: string }) {
  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1>{title}</h1>
        <div className="sub">
          PRÓXIMAMENTE <span className="blink">_</span>
        </div>
      </section>
    </div>
  );
}
