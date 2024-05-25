import React, { useState, useEffect, useRef } from 'react';
import { SketchPicker } from 'react-color';
import io from 'socket.io-client';
import styled from 'styled-components';

const Container = styled.div`
  background: linear-gradient(45deg, rgb(167, 243, 208), rgb(243, 244, 246));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const Canvas = styled.canvas`
  background: white;
  border: 2px solid #f9f6ee;
`;

const StyledHeading = styled.h1`
  color: rgb(96, 165, 250);
  font-family: sans-serif;
  text-align: center;
`;

const Button = styled.button`
  background-color: rgb(33, 150, 243);
  border-bottom: 0;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
  border-left: 0;
  border-right: 0;
  border-top: 0;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
  margin: 20px 20px;
  color: rgb(255, 255, 255);
  cursor: pointer;
  display: inline-block;
  font-family: 'Roboto', 'Segoe UI';
  font-size: 14px;
  font-weight: 500;
  height: 36px;
  line-height: 36px;
  min-width: 64px;
  text-align: center;
  text-transform: uppercase;
  transition: box-shadow 0.2s ease;
  box-shadow:
    rgba(0, 0, 0, 0.2) 0px 3px 1px -2px,
    rgba(0, 0, 0, 0.14) 0px 2px 2px 0px,
    rgba(0, 0, 0, 0.12) 0px 1px 5px 0px;
`;

const App = () => {
  const [selectedColor, setSelectedColor] = useState('red');
  const [socket, setSocket] = useState(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const prevCoord = useRef(null);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    const socket = io('ws://localhost:4000');
    setSocket(socket);

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('mousemove', handleMouseDrag);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('mousemove', handleMouseDrag);
      }
      socket.disconnect();
    };
  }, []);

  const handleMouseDrag = (event) => {
    if (socket && isMouseDown) {
      const rect = canvasRef.current.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;

      if (prevCoord.current) {
        const { prevX, prevY } = prevCoord.current;
        draw(prevX, prevY, offsetX, offsetY, selectedColor);
        socket.emit('draw', prevX, prevY, offsetX, offsetY, selectedColor);
      }
      prevCoord.current = { prevX: offsetX, prevY: offsetY };
    }
  };

  const draw = (prevX, prevY, x, y, color) => {
    ctxRef.current.strokeStyle = color;
    ctxRef.current.lineJoin = 'round';
    ctxRef.current.lineCap = 'round';
    ctxRef.current.lineWidth = 5;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(prevX, prevY);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  const handleClearCanvas = () => {
    ctxRef.current.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );
    socket.emit('clear', '');
  };

  const handleColorChange = (color, event) => {
    setSelectedColor(color.hex);
  };

  const handleMouseDown = () => {
    setIsMouseDown(true);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    prevCoord.current = null;
  };

  useEffect(() => {
    if (socket) {
      socket.on('receive', (x, y, offsetX, offsetY, color) => {
        draw(x, y, offsetX, offsetY, color);
      });

      socket.on('clear', () => {
        ctxRef.current.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height,
        );
      });
    }
  }, [socket]);

  return (
    <Container>
      <StyledHeading>Live Canvas</StyledHeading>
      <Canvas
        id="canvas"
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseDrag}
      />
      <Button onClick={handleClearCanvas}>Clear</Button>
      <SketchPicker color={selectedColor} onChange={handleColorChange} />;
    </Container>
  );
};

export default App;
