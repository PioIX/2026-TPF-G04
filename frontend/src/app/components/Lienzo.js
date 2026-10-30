"use client";

import { useRef, useState } from "react";

export default function Lienzo({ width = 600, height = 300 }) {
  const [color, setColor] = useState("#000000");
  const [grosor, setGrosor] = useState(5);

  const canvasRef = useRef(null);
  const dibujando = useRef(false);
  const ultimo = useRef({ x: 0, y: 0 });

  function posicion(event) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * escalaX,
      y: (event.clientY - rect.top) * escalaY,
    };
  }

  function empezar(event) {
    dibujando.current = true;
    ultimo.current = posicion(event);
  }

  function parar() {
    dibujando.current = false;
  }

  function dibujar(event) {
    if (!dibujando.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const actual = posicion(event);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = "round";
    ctx.moveTo(ultimo.current.x, ultimo.current.y);
    ctx.lineTo(actual.x, actual.y);
    ctx.stroke();

    ultimo.current = actual;
  }

  function limpiar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ backgroundColor: "white", width: "100%", height: "100%" }}
        onMouseDown={empezar}
        onMouseUp={parar}
        onMouseLeave={parar}
        onMouseMove={dibujar}
      />

      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <input
          type="range"
          min="1"
          max="15"
          value={grosor}
          onChange={(e) => setGrosor(Number(e.target.value))}
        />
        <button onClick={limpiar}>Limpiar</button>
      </div>
    </div>
  );
}