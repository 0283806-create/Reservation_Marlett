import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="hero-wrapper" aria-label="Fachada Marlett">
      <div className="hero-banner">
        <img
          src="/assets/PHOTO-2025-07-09-20-40-28.jpeg"
          alt="Fachada del restaurante y salón Marlett"
          className="hero-image"
          loading="lazy"
          decoding="async"
        />
      </div>
    </section>
  );
};

export default Hero;
