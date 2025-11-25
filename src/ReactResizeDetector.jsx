import React, { useState } from 'react';
import ResizeAware from 'react-resize-aware';

const ReactResizeDetector = (props) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // This function gets called by ResizeAware whenever the size changes
  const handleResize = ({ width, height }) => {
    setDimensions({ width, height });
    props.onResize(width, height)
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResizeAware 
        onResize={handleResize}
        style={{ width: '100%', height: '100%' }} // Style the wrapper div
      >
        {/* Pass the dimensions down as props to your class component */}
        {props.children ? props.children : <></>}
      </ResizeAware>
    </div>
  );
}
export default ReactResizeDetector;