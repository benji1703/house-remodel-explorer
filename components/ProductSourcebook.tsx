"use client";

import Image from "next/image";
import { productReferences } from "@/data/productReferences";
import { sourcebookScenes } from "@/data/sourcebookScenes";

export function ProductSourcebook() {
  return (
    <div className="materials-view product-sourcebook-view">
      <header className="materials-header">
        <div>
          <p className="materials-kicker">Israeli specification references</p>
          <h2>Objects with a reason to be here.</h2>
        </div>
        <p>Sanitaryware, Grohe fittings, kitchen decisions and a warm mineral wall effect, selected against the measured rooms.</p>
      </header>
      <section className="sourcebook-playbook" aria-label="Designer playbook">
        <article><strong>Spend where it lasts</strong><span>Put the money into the measured joinery, good lighting positions, and waterproofing. They are hard to change later.</span></article>
        <article><strong>Keep finishes simple</strong><span>Use local oak veneer, a dependable tap where it is hidden, and one beautiful surface instead of a room full of competing ideas.</span></article>
        <article><strong>Repeat one metal</strong><span>Use the same aged brass or bronze on handles, taps, and lights. The house feels calmer when the details agree.</span></article>
        <article><strong>Live with samples</strong><span>Place the stone, wall finish, and timber beside the sage frames in morning and evening light before you order.</span></article>
      </section>
      <section className="sourcebook-scenes" aria-labelledby="sourcebook-scenes-title">
        <div className="sourcebook-scenes-heading">
          <div>
            <p className="materials-kicker">In the house · visual studies</p>
            <h3 id="sourcebook-scenes-title">Real items, staged for this plan.</h3>
          </div>
          <p>Editorial references use Villa Nehama’s rooms, openings, light, and planting language. Product links point to the actual specification target.</p>
        </div>
        <div className="sourcebook-scenes-grid">
          {sourcebookScenes.map((scene) => (
            <article className="sourcebook-scene" key={scene.title}>
              <figure>
                <Image src={scene.image} alt={scene.alt} fill sizes="(max-width: 700px) 100vw, 50vw" />
                <figcaption>{scene.eyebrow}</figcaption>
              </figure>
              <div className="sourcebook-scene-copy">
                <h4>{scene.title}</h4>
                <p>{scene.description}</p>
                <ul aria-label={`${scene.title} product references`}>
                  {scene.products.map((product) => <li key={product.name}><a href={product.url} target="_blank" rel="noreferrer">{product.name} ↗</a></li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="product-sourcebook-grid" aria-label="Product and finish references">
        {productReferences.map((product) => (
          <article key={product.name} className="product-reference">
            <figure className="product-reference-image">
              <Image src={product.image} alt={product.alt} fill sizes="(max-width: 700px) 100vw, 33vw" />
            </figure>
            <div className="product-reference-copy">
              <p>{product.category}</p>
              <h3>{product.name}</h3>
              <strong>{product.maker}</strong>
              <span>{product.rationale}</span>
              {product.budgetRole && <small className="product-reference-meta"><b>{product.budgetRole}</b>{product.fitNote ? ` · ${product.fitNote}` : ""}</small>}
              {product.moodMatch && <small className="product-reference-match">{product.moodMatch}</small>}
              <a href={product.url} target="_blank" rel="noreferrer">View product reference ↗</a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
