import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="hero-wrap" aria-label="Fachada de Marlett">
      <div className="hero-card">
        <img
          src="/assets/marlett_hero.jpeg"
          alt="Fachada de Marlett — Restaurante &amp; Salón de eventos"
          className="hero-image"
          loading="eager"
          decoding="async"
        />
      </div>
    </section>
  );
};

export default Hero;
