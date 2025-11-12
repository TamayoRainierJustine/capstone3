import React, { useRef } from 'react';
import './AboutSection.css';

export default function AboutSection({ title, text, onEdit }) {
  const titleRef = useRef();
  const textRef = useRef();

  const handleBlur = () => {
    onEdit({
      title: titleRef.current.innerText,
      text: textRef.current.innerText,
    });
  };

  return (
    <section className="about-section">
      <h2
        ref={titleRef}
        contentEditable
        suppressContentEditableWarning
        className="about-title"
        onBlur={handleBlur}
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <p
        ref={textRef}
        contentEditable
        suppressContentEditableWarning
        className="about-text"
        onBlur={handleBlur}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </section>
  );
} 