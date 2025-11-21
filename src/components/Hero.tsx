import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="hero-wrapper">
      <div className="hero-banner">
        <img 
          src="/assets/PHOTO-2025-07-09-20-40-28.jpeg"
          className="hero-image"
          alt="Fachada Marlett"
          loading="eager"
          decoding="async"
        />
      </div>
    </section>
  );
};

export default Hero;
