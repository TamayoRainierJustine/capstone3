import React, { useState, useEffect, useRef } from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw, Modifier } from 'draft-js';
import 'draft-js/dist/Draft.css';

const COLORS = [
  '#000000', '#1e293b', '#3b82f6', '#ef4444', '#f59e42', '#22c55e', '#eab308', '#fff'
];
const FONT_SIZES = [12, 16, 20, 24, 32, 40];

function styleMap(fontSize, color) {
  return {
    FONT_SIZE: { fontSize: fontSize ? fontSize + 'px' : undefined },
    COLOR: { color: color || undefined },
  };
}

export default function RichTextEditor({ value, onChange, placeholder = '', style = {} }) {
  const [editorState, setEditorState] = useState(
    value
      ? EditorState.createWithContent(convertFromRaw(JSON.parse(value)))
      : EditorState.createEmpty()
  );
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const editorRef = useRef();

  useEffect(() => {
    if (value) {
      setEditorState(EditorState.createWithContent(convertFromRaw(JSON.parse(value))));
    }
  }, [value]);

  const handleChange = (state) => {
    setEditorState(state);
    const content = state.getCurrentContent();
    onChange(JSON.stringify(convertToRaw(content)));
  };

  const handleKeyCommand = (command) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      handleChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const toggleInlineStyle = (style) => {
    handleChange(RichUtils.toggleInlineStyle(editorState, style));
  };

  const applyColor = (color) => {
    const selection = editorState.getSelection();
    const nextContentState = Object.keys(COLORS).reduce((contentState, c) => {
      return Modifier.removeInlineStyle(contentState, selection, 'COLOR-' + COLORS[c]);
    }, editorState.getCurrentContent());
    let nextEditorState = EditorState.push(
      editorState,
      nextContentState,
      'change-inline-style'
    );
    nextEditorState = RichUtils.toggleInlineStyle(nextEditorState, 'COLOR-' + color);
    setEditorState(nextEditorState);
    setCurrentColor(color);
    handleChange(nextEditorState);
  };

  const applyFontSize = (size) => {
    const selection = editorState.getSelection();
    const contentState = editorState.getCurrentContent();
    let nextContentState = contentState;
    FONT_SIZES.forEach(s => {
      nextContentState = Modifier.removeInlineStyle(nextContentState, selection, 'FONTSIZE-' + s);
    });
    let nextEditorState = EditorState.push(
      editorState,
      nextContentState,
      'change-inline-style'
    );
    nextEditorState = RichUtils.toggleInlineStyle(nextEditorState, 'FONTSIZE-' + size);
    setEditorState(nextEditorState);
    setCurrentFontSize(size);
    handleChange(nextEditorState);
  };

  // Custom style map for color and font size
  const customStyleMap = {
    ...Object.fromEntries(COLORS.map(c => ['COLOR-' + c, { color: c }])),
    ...Object.fromEntries(FONT_SIZES.map(s => ['FONTSIZE-' + s, { fontSize: s + 'px' }]))
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: 8, borderRadius: 4, ...style }}>
      <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
        <button type="button" onMouseDown={e => { e.preventDefault(); toggleInlineStyle('BOLD'); }}><b>B</b></button>
        <button type="button" onMouseDown={e => { e.preventDefault(); toggleInlineStyle('ITALIC'); }}><i>I</i></button>
        <button type="button" onMouseDown={e => { e.preventDefault(); toggleInlineStyle('UNDERLINE'); }}><u>U</u></button>
        <span style={{ marginLeft: 8 }}>Color:</span>
        {COLORS.map(c => (
          <span
            key={c}
            onClick={() => applyColor(c)}
            style={{ background: c, width: 18, height: 18, display: 'inline-block', border: c === currentColor ? '2px solid #3b82f6' : '1px solid #ccc', cursor: 'pointer', borderRadius: 3 }}
          />
        ))}
        <span style={{ marginLeft: 8 }}>Font size:</span>
        <select value={currentFontSize} onChange={e => applyFontSize(Number(e.target.value))}>
          {FONT_SIZES.map(s => (
            <option key={s} value={s}>{s}px</option>
          ))}
        </select>
      </div>
      <div onClick={() => editorRef.current && editorRef.current.focus()}>
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={handleChange}
          handleKeyCommand={handleKeyCommand}
          placeholder={placeholder}
          customStyleMap={customStyleMap}
        />
      </div>
    </div>
  );
} 