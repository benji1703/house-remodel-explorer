"use client";

import Image from "next/image";
import { plantReferences } from "@/data/plants";

export function PlantsBoard() {
  return (
    <div className="materials-view plants-view">
      <header className="materials-header">
        <div>
          <p className="materials-kicker">Beit Hananiah · 1,000 m² lot</p>
          <h2>A garden that belongs here.</h2>
        </div>
        <p>Coastal Mediterranean planting for hot sun, winter rain, sea air and long summer evenings. Structure first, scent and pollinators close to the house.</p>
      </header>
      <figure className="plants-hero">
        <Image src="/references/plants-beit-hananiah-hero.webp" alt="Warm coastal Mediterranean garden around Villa Nehama with olive, carob, mastic, rosemary, lavender and bougainvillea" fill sizes="(max-width: 800px) 100vw, 1480px" priority />
        <figcaption>Planting atmosphere · coastal Mediterranean palette</figcaption>
      </figure>
      <section className="plants-in-situ" aria-labelledby="plants-in-situ-title">
        <figure>
          <Image src="/references/sourcebook/terrace-iron.webp" alt="Villa Nehama courtyard planting at house scale with olive, mastic, rosemary and sea lavender" fill sizes="(max-width: 800px) 100vw, 58vw" />
          <figcaption>House scale · courtyard and pergola edge</figcaption>
        </figure>
        <div>
          <p className="materials-kicker">In the house · planting study</p>
          <h3 id="plants-in-situ-title">A garden around the terrace.</h3>
          <p>Olive shade, pale gravel and herbs beside the stone. The larger trees belong further out in the garden; around the terrace, planting stays low enough to leave the doors and paths open.</p>
          <ul>{["Olive + carob canopy", "Mastic boundary", "Rosemary + Israeli sage", "Sea lavender edge", "Bougainvillea pergola"].map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>
      <section className="plants-brief" aria-label="Planting principles">
        <div><strong>01 · Canopy</strong><span>Carob, olive and mastic create shade without turning the house into a park.</span></div>
        <div><strong>02 · Courtyard</strong><span>Rosemary, Israeli sage and sea lavender keep the mineral palette fragrant and alive.</span></div>
        <div><strong>03 · Pergola</strong><span>One trained climber softens timber; leave door swings, drainage and maintenance clear.</span></div>
        <div><strong>04 · Water</strong><span>Drip irrigate establishment zones, mulch deeply, then reduce summer frequency as roots settle.</span></div>
      </section>
      <header className="plants-palette-heading">
        <div><p className="materials-kicker">Ten plants for the garden</p><h3>From the gate to the terrace.</h3></div>
        <p>Each image shows a proposed setting at Villa Nehama. These are generated planting studies; the botanical names below identify the plants to source.</p>
      </header>
      <section className="plants-grid" aria-label="Planting palette">
        {plantReferences.map((plant, index) => (
          <article className="plant-card" key={plant.botanical}>
            <figure><Image src={plant.image} alt={`${plant.name} (${plant.botanical}) in a proposed Villa Nehama garden setting. ${plant.placement}`} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw" unoptimized /><span>{String(index + 1).padStart(2, "0")}</span></figure>
            <div className="plant-card-copy">
              <p>{plant.role}</p>
              <h3>{plant.name}</h3>
              <em>{plant.botanical}</em>
              <p className="plant-placement">{plant.placement}</p>
              <span>{plant.ecology}</span>
              <dl><div><dt>Sun</dt><dd>{plant.sun}</dd></div><div><dt>Water</dt><dd>{plant.water}</dd></div><div><dt>Size</dt><dd>{plant.height}</dd></div></dl>
              <small>{plant.zones.join(" · ")}</small>
              <a href={plant.url} target="_blank" rel="noreferrer">Verify local availability ↗</a>
            </div>
          </article>
        ))}
      </section>
      <footer className="materials-footer">Planting brief only · confirm soil, salt exposure, wind, mature root spread and local nursery stock with a landscape architect before ordering. Images are generated planting studies for Villa Nehama, not photographs of an installed garden.</footer>
    </div>
  );
}
