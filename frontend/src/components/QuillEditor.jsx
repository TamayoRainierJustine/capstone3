import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const QuillEditor = ({ value, onChange, toolbar, placeholder, style }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const isInternalChangeRef = useRef(false);

  useEffect(() => {
    if (!editorRef.current) return;

    // Initialize Quill
    quillRef.current = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: toolbar || [
          ['bold', 'italic', 'underline'],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['clean']
        ]
      },
      placeholder: placeholder || '',
    });

    // Set initial value
    if (value) {
      quillRef.current.root.innerHTML = value;
    }

    // Handle text changes
    quillRef.current.on('text-change', () => {
      if (!isInternalChangeRef.current && quillRef.current) {
        const content = quillRef.current.root.innerHTML;
        if (onChange) {
          onChange(content);
        }
      }
    });

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  // Update content when value prop changes (but not from internal changes)
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      isInternalChangeRef.current = true;
      quillRef.current.root.innerHTML = value || '';
      setTimeout(() => {
        isInternalChangeRef.current = false;
      }, 0);
    }
  }, [value]);

  return (
    <div style={style}>
      <div ref={editorRef} style={{ minHeight: '100px' }}></div>
    </div>
  );
};

export default QuillEditor;
