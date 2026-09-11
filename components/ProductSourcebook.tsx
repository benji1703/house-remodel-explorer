"use client";

import Image from "next/image";
import { productReferences } from "@/data/productReferences";

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
              <a href={product.url} target="_blank" rel="noreferrer">View product reference ↗</a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
