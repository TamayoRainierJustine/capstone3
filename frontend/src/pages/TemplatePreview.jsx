import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const TemplatePreview = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();

  // Map template IDs to HTML file names
  const templateMap = {
    bladesmith: 'struvaris.html',
    pottery: 'truvara.html',
    balisong: 'ructon.html',
    weavery: 'urastra.html',
    woodcarving: 'caturis.html'
  };

  const templateFile = templateMap[templateId];

  if (!templateFile) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Template not found</h2>
          <Link to="/store-templates" style={{ color: '#3b82f6', marginTop: '1rem', display: 'inline-block' }}>
            Back to Templates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ position: 'relative' }}>
        {/* Preview Header */}
        <div style={{
          background: 'white',
          padding: '1rem 2rem',
          borderBottom: '2px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: '0',
          zIndex: 100
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>
            Template Preview
          </h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link
              to="/store-templates"
              style={{
                padding: '0.5rem 1.5rem',
                background: '#f3f4f6',
                color: '#374151',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#e5e7eb';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
            >
              Back to Templates
            </Link>
            <button
              onClick={() => navigate('/store-setup', { state: { templateId } })}
              style={{
                padding: '0.5rem 1.5rem',
                background: 'linear-gradient(45deg, #FF6B9D, #C44569)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 500,
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
            >
              Use This Template
            </button>
          </div>
        </div>

        {/* Template Preview Iframe */}
        <iframe
          src={`/templates/${templateFile}`}
          style={{
            width: '100%',
            height: 'calc(100vh - 80px)',
            border: 'none',
            display: 'block'
          }}
          title={`${templateId} Template Preview`}
        />
      </div>
    </div>
  );
};

export default TemplatePreview;
