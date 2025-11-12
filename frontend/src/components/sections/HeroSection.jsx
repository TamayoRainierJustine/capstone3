import React, { useRef } from 'react';
import './HeroSection.css';

export default function HeroSection({ title, subtitle, onEdit }) {
  const titleRef = useRef();
  const subtitleRef = useRef();

  const handleBlur = () => {
    onEdit({
      title: titleRef.current.innerText,
      subtitle: subtitleRef.current.innerText,
    });
  };

  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          className="hero-title"
          onBlur={handleBlur}
          dangerouslySetInnerHTML={{ __html: title }}
        />
        <p
          ref={subtitleRef}
          contentEditable
          suppressContentEditableWarning
          className="hero-subtitle"
          onBlur={handleBlur}
          dangerouslySetInnerHTML={{ __html: subtitle }}
        />
      </div>
    </section>
  );
} 