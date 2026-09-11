"use client";

import Image from "next/image";
import { materialCards, materialsForMood } from "@/data/materials";
import type { MoodBoardId } from "@/data/moodboards";

export function MoodTextureStrip({ moodId, onOpen }: { moodId: MoodBoardId; onOpen: () => void }) {
  const materials = materialsForMood(moodId);
  return (
    <section className="mood-texture-strip" aria-label="Material textures">
      <div className="mood-texture-copy">
        <span>Texture study</span>
        <button type="button" onClick={onOpen}>Open material library</button>
      </div>
      <div className="mood-texture-swatches">
        {materials.map((material) => (
          <figure key={material.id}>
            <span className={`mood-texture-image is-${material.format}`}>
              <Image src={material.image} alt={material.alt} fill sizes="96px" unoptimized />
            </span>
            <figcaption>{material.title}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function MaterialsBoard() {
  return (
    <div className="materials-view">
      <header className="materials-header">
        <div>
          <p className="materials-kicker">Villa Nehama · material direction</p>
          <h2>Surfaces worth touching.</h2>
        </div>
        <p>
          A working palette of grain, mineral movement, weave and planting. These references define character—not geometry—and remain subject to physical samples.
        </p>
      </header>

      <div className="materials-palette" aria-label="Core palette">
        <span style={{ background: "#c5a47e" }}>Oak</span>
        <span style={{ background: "#e7ded1" }}>Plaster</span>
        <span style={{ background: "#d7c9b5" }}>Stone</span>
        <span style={{ background: "#8b6a49", color: "#fff" }}>Bronze</span>
        <span style={{ background: "#9a7955", color: "#fff" }}>Timber</span>
        <span style={{ background: "#a96b48", color: "#fff" }}>Clay</span>
      </div>

      <section className="materials-masonry" aria-label="Pinterest-style material moodboard">
        {materialCards.map((material, index) => (
          <article className={`material-pin is-${material.format}`} key={material.id}>
            <figure>
              <Image
                src={material.image}
                alt={material.alt}
                fill
                sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 24vw"
                priority={index < 4}
                unoptimized
              />
              <span>{String(index + 1).padStart(2, "0")}</span>
            </figure>
            <div className="material-pin-copy">
              <p>{material.family}</p>
              <h3>{material.title}</h3>
              <blockquote>{material.description}</blockquote>
              <dl>
                <div><dt>Intent</dt><dd>{material.specification}</dd></div>
                <div><dt>Finish</dt><dd>{material.finish}</dd></div>
              </dl>
            </div>
          </article>
        ))}
      </section>

      <footer className="materials-footer">
        Visual direction only · confirm every finish with a large physical sample in morning and evening light.
      </footer>
    </div>
  );
}
