"use client";

import { useState, useEffect, useRef } from 'react';
import Button from "./Button";
import Input from "./Input";

function dibujarSegmento(ctx, { desde, hasta, color, grosor }) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.lineCap = "round";
    ctx.moveTo(desde.x, desde.y);
    ctx.lineTo(hasta.x, hasta.y);
    ctx.stroke();
}

function rellenarZona(ctx, canvas, xInicio, yInicio, colorHex, tolerancia = 50) {
    const { width: ancho, height: alto } = canvas;
    const x0 = Math.floor(xInicio);
    const y0 = Math.floor(yInicio);
    if (x0 < 0 || y0 < 0 || x0 >= ancho || y0 >= alto) return;

    const imagen = ctx.getImageData(0, 0, ancho, alto);
    const datos = imagen.data;
    const n = parseInt(colorHex.slice(1), 16);
    const [rNuevo, gNuevo, bNuevo] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];

    // Se compone sobre blanco porque el canvas es transparente y la goma pinta en blanco
    const colorSobreBlanco = (idx) => {
        const p = idx * 4;
        const a = datos[p + 3] / 255;
        return [
            datos[p] * a + 255 * (1 - a),
            datos[p + 1] * a + 255 * (1 - a),
            datos[p + 2] * a + 255 * (1 - a)
        ];
    };

    // Para que no trabaje en bucle por el color
    const [rObj, gObj, bObj] = colorSobreBlanco(y0 * ancho + x0);
    if (
        Math.abs(rObj - rNuevo) < 5 &&
        Math.abs(gObj - gNuevo) < 5 &&
        Math.abs(bObj - bNuevo) < 5
    ) return;

    // Lista de pixeles
    const visitado = new Uint8Array(ancho * alto);
    const pila = [[x0, y0]];

    while (pila.length) {
        const [x, y] = pila.pop();
        const idx = y * ancho + x;

        if (x < 0 || y < 0 || x >= ancho || y >= alto || visitado[idx]) continue;

        const [r, g, b] = colorSobreBlanco(idx);
        if (
            // Tolerancia es simplemente el margen de error que le permites al bote de pintura al comparar colores.
            Math.abs(r - rObj) > tolerancia ||
            Math.abs(g - gObj) > tolerancia ||
            Math.abs(b - bObj) > tolerancia
        ) continue;

        visitado[idx] = 1;
        datos.set([rNuevo, gNuevo, bNuevo, 255], idx * 4);

        pila.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    ctx.putImageData(imagen, 0, 0);
}

export default function Lienzo({ esMiTurno, socket }) {
    const canvasRef = useRef(null); //fakso document.getElementbyId
    const dibujando = useRef(false);
    const ultimo = useRef({ x: 0, y: 0 });
    // Herramienta de React (Hook) que permite guardar o modificar un valor sin necesidad de renderizar la pantalla
    // En cambio, el useState SÍ guarda variables de estado visuales
    const trazos = useRef([]);

    const [color, setColor] = useState("#000000");
    const [grosor, setGrosor] = useState(5);
    // Variable que guarda la herramienta seleccionada por el usuario (inicialmente es lápiz)
    const [herramienta, setHerramienta] = useState("lapiz"); // "lapiz" | "goma" | "balde"

    function guardarTrazo(segmento, esNuevo) {
        if (esNuevo || trazos.current.length === 0) {
            trazos.current.push([segmento]);
        } else {
            trazos.current[trazos.current.length - 1].push(segmento);
        }
    }

    function redibujarTodo(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        trazos.current.forEach((trazo) => {
            if (trazo[0]?.tipo === 'relleno') {
                rellenarZona(ctx, canvas, trazo[0].x, trazo[0].y, trazo[0].color);
            } else {
                trazo.forEach((seg) => dibujarSegmento(ctx, seg));
            }
        });
    }

    useEffect(() => {
        // "canvas" es un objeto que viene integrado en HTML5/JavaScript y tiene metodos y propiedades
        // "canvas" devuelve un objeto lleno de herramientas de dibujo llamado CanvasRenderingContext2D

        // Propiedades (como configurar el pincel antes de pintar):
        // ctx.strokeStyle (el color de la línea)
        // ctx.lineWidth (el grosor del trazo)
        // ctx.lineCap (la forma de la punta)

        // Métodos (las órdenes para pintar o borrar):
        // ctx.moveTo() y ctx.lineTo() (mover el lápiz)
        // ctx.stroke() (dibujar la línea)
        // ctx.clearRect() (borrar todo el lienzo, como haces en el botón "Limpiar")   
        // ctx.getImageData()
        // ctx.putImageData() (leer y cambiar píxeles uno por uno, como haces en la herramienta del balde)

        const canvas = canvasRef.current;
        if (!canvas || !socket) return;
        // Se devuelve un objeto lleno de herramientas de dibujo llamado CanvasRenderingContext2D
        const ctx = canvas.getContext("2d"); // Abreviatura de Context: ctx 

        const onTrazo = (data) => {
            dibujarSegmento(ctx, data);
            guardarTrazo(data, data.nuevoTrazo);
        };

        const onLimpieza = () => {
            trazos.current = [];
            dibujando.current = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };

        const onDeshacer = () => {
            if (trazos.current.length > 0) {
                trazos.current.pop();
                redibujarTodo(ctx, canvas);
            }
        };

        const onRelleno = (data) => {
            rellenarZona(ctx, canvas, data.x, data.y, data.color);
            trazos.current.push([{ tipo: 'relleno', ...data }]);
        };

        socket.on('recibir_trazo', onTrazo);
        socket.on('recibir_limpieza', onLimpieza);
        socket.on('recibir_deshacer', onDeshacer);
        socket.on('recibir_relleno', onRelleno);

        return () => {
            socket.off('recibir_trazo', onTrazo);
            socket.off('recibir_limpieza', onLimpieza);
            socket.off('recibir_deshacer', onDeshacer);
            socket.off('recibir_relleno', onRelleno);
        };
    }, [socket]);

    useEffect(() => {
        const manejarTeclado = (e) => {
            if (esMiTurno && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                deshacer();
            }
        };
        window.addEventListener('keydown', manejarTeclado);
        return () => window.removeEventListener('keydown', manejarTeclado);
    }, [esMiTurno]);

    function posicion(e) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (canvas.width / rect.width),
            y: (e.clientY - rect.top) * (canvas.height / rect.height)
        };
    }

    function trazar(desde, hasta, nuevoTrazo) {
        const ctx = canvasRef.current.getContext("2d");
        const colorActivo = herramienta === "goma" ? "#FFFFFF" : color;
        const segmento = { desde, hasta, color: colorActivo, grosor };

        dibujarSegmento(ctx, segmento);
        guardarTrazo(segmento, nuevoTrazo);
        socket?.emit('enviar_trazo', { ...segmento, nuevoTrazo });
    }

    function empezar(e) {
        if (!esMiTurno || !canvasRef.current) return;
        const pos = posicion(e);

        if (herramienta === "balde") {
            const canvas = canvasRef.current;
            rellenarZona(canvas.getContext("2d"), canvas, pos.x, pos.y, color);
            const relleno = { tipo: 'relleno', x: pos.x, y: pos.y, color };
            trazos.current.push([relleno]);
            socket?.emit('enviar_relleno', relleno);
            return;
        }

        dibujando.current = true;
        ultimo.current = pos;
        trazar(pos, pos, true);
    }

    function dibujar(e) {
        if (!esMiTurno || !dibujando.current || !canvasRef.current) return;
        const actual = posicion(e);
        trazar(ultimo.current, actual, false);
        ultimo.current = actual;
    }

    function parar() {
        dibujando.current = false;
    }

    function deshacer() {
        if (!esMiTurno || !canvasRef.current || trazos.current.length === 0) return;
        const canvas = canvasRef.current;
        trazos.current.pop();
        redibujarTodo(canvas.getContext("2d"), canvas);
        socket?.emit('deshacer_trazo');
    }

    function limpiar() {
        if (!esMiTurno || !canvasRef.current) return;
        const canvas = canvasRef.current;
        trazos.current = [];
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        socket?.emit('limpiar_canvas');
    }

    const estiloBotonHerramienta = (activo) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        borderRadius: '8px',
        border: activo ? '2px solid #FFA012' : '2px solid transparent',
        backgroundColor: activo ? '#25499F' : '#ffffff',
        color: activo ? '#ffffff' : '#25499F',
        fontWeight: 'bold',
        cursor: 'pointer'
    });

    const cursores = {
        lapiz: "crosshair",
        goma: "cell",
        balde: "copy"
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <canvas
                ref={canvasRef}
                width={600}
                height={400}
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    cursor: esMiTurno ? cursores[herramienta] : "not-allowed"
                }}
                onMouseDown={empezar}
                onMouseUp={parar}
                onMouseLeave={parar}
                onMouseMove={dibujar}
            />

            {esMiTurno && (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => setHerramienta("lapiz")}
                        style={estiloBotonHerramienta(herramienta === "lapiz")}
                    >
                        ✏️ Lápiz
                    </button>

                    <button
                        type="button"
                        onClick={() => setHerramienta("goma")}
                        style={estiloBotonHerramienta(herramienta === "goma")}
                    >
                        🧽 Goma
                    </button>

                    <button
                        type="button"
                        onClick={() => setHerramienta("balde")}
                        style={estiloBotonHerramienta(herramienta === "balde")}
                    >
                        🪣 Balde
                    </button>

                    <Input
                        type="color"
                        value={color}
                        onChange={(e) => {
                            setColor(e.target.value);
                            setHerramienta((h) => (h === "goma" ? "lapiz" : h));
                        }}
                    />

                    <Input
                        type="range"
                        min="1"
                        max="30"
                        value={grosor}
                        onChange={(e) => setGrosor(Number(e.target.value))}
                    />

                    <button
                        type="button"
                        onClick={deshacer}
                        title="Deshacer último trazo (Ctrl + Z)"
                        style={estiloBotonHerramienta(false)}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M9 14L4 9l5-5" />
                            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                        </svg>
                    </button>

                    <Button onClick={limpiar} txt="Limpiar" />
                </div>
            )}
        </div>
    );
}