"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from "../components/Button";
import Input from "../components/Input";
import styles from './page.module.css';
import io from 'socket.io-client';
import { Knewave, Hammersmith_One, League_Spartan } from "next/font/google";

const knewave = Knewave({ weight: "400", subsets: ["latin"], variable: "--font-knewave" });
const hammersmithOne = Hammersmith_One({ subsets: ["latin"], weight: "400", variable: "--font-hammersmith" });
const leagueSpartan = League_Spartan({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-league-spartan" });

const socket = io('http://localhost:4000', { autoConnect: true });
const COLORES_PODIO = ['#f7941d', '#bdbdbd', '#a45a19'];

// --- UTILIDADES ---
function obtenerNombreUsuario(raw) {
    if (!raw) return 'Jugador';
    try {
        const parsed = JSON.parse(raw);
        return (parsed.usuario || parsed).toString().trim() || 'Jugador';
    } catch {
        return raw.replace(/['"]+/g, '').trim() || 'Jugador';// Se recprtan los espacios
    }
}

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

    const [rObj, gObj, bObj] = colorSobreBlanco(y0 * ancho + x0);
    if (
        Math.abs(rObj - rNuevo) < 5 &&
        Math.abs(gObj - gNuevo) < 5 &&
        Math.abs(bObj - bNuevo) < 5
    ) return;

    const visitado = new Uint8Array(ancho * alto);
    const pila = [[x0, y0]];

    while (pila.length > 0) {
        const [x, y] = pila.pop();
        if (x < 0 || y < 0 || x >= ancho || y >= alto) continue;

        const idx = y * ancho + x;
        if (visitado[idx]) continue;

        const [r, g, b] = colorSobreBlanco(idx);
        if (
            Math.abs(r - rObj) > tolerancia ||
            Math.abs(g - gObj) > tolerancia ||
            Math.abs(b - bObj) > tolerancia
        ) continue;

        visitado[idx] = 1;
        const p = idx * 4;
        datos[p] = rNuevo;
        datos[p + 1] = gNuevo;
        datos[p + 2] = bNuevo;
        datos[p + 3] = 255;

        pila.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imagen, 0, 0);
}

// --- COMPONENTE LIENZO ---
function Lienzo({ esMiTurno }) {
    const canvasRef = useRef(null);
    const dibujando = useRef(false);
    const ultimo = useRef({ x: 0, y: 0 });
    const trazos = useRef([]);

    const [color, setColor] = useState("#000000");
    const [grosor, setGrosor] = useState(5);
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
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

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
    }, []);

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
        socket.emit('enviar_trazo', { ...segmento, nuevoTrazo });
    }

    function empezar(e) {
        if (!esMiTurno || !canvasRef.current) return;
        const pos = posicion(e);

        if (herramienta === "balde") {
            const canvas = canvasRef.current;
            rellenarZona(canvas.getContext("2d"), canvas, pos.x, pos.y, color);
            const relleno = { tipo: 'relleno', x: pos.x, y: pos.y, color };
            trazos.current.push([relleno]);
            socket.emit('enviar_relleno', relleno);
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
        socket.emit('deshacer_trazo');
    }

    function limpiar() {
        if (!esMiTurno || !canvasRef.current) return;
        const canvas = canvasRef.current;
        trazos.current = [];
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('limpiar_canvas');
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

// --- COMPONENTE CHAT ---
function ChatJuego({ nombreUsuario, isPainter }) {
    const [mensaje, setMensaje] = useState('');
    const [historialChat, setHistorialChat] = useState([
        { usuario: 'Sistema', texto: '¡Bienvenidos a la partida!', isSystem: true }
    ]);

    useEffect(() => {
        const manejarNuevoMensaje = (nuevoMensaje) => {
            setHistorialChat((prev) => [...prev, nuevoMensaje]);
        };
        socket.on('recibir_mensaje', manejarNuevoMensaje);
        return () => socket.off('recibir_mensaje', manejarNuevoMensaje);
    }, []);

    const enviarMensaje = (e) => {
        e.preventDefault();
        if (!mensaje.trim() || isPainter) return;

        socket.emit('enviar_mensaje', {
            usuario: nombreUsuario || 'Jugador',
            texto: mensaje
        });
        setMensaje('');
    };

    return (
        <div className={styles.chatCard}>
            <h2 className={styles.chatHeader}>CHAT</h2>

            <div className={styles.chatMessages}>
                {historialChat.map((msg, index) => (
                    <div
                        key={index}
                        className={msg.isSystem ? styles.systemMessage : styles.messageItem}
                    >
                        <strong className={styles.msgUser}>{msg.usuario}:</strong>
                        <span className={styles.msgText}>{msg.texto}</span>
                    </div>
                ))}
            </div>

            <form onSubmit={enviarMensaje} className={styles.chatForm}>
                <input
                    type="text"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder={isPainter ? "Estás dibujando..." : "Escribe tu respuesta..."}
                    disabled={isPainter}
                />
                <button type="submit" disabled={isPainter}>Enviar</button>
            </form>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function Page() {
    const searchParams = useSearchParams();
    const salaId = searchParams.get('sala') || "01";
    const rawUsuario = searchParams.get('usuario') || '';
    const nombreUsuario = obtenerNombreUsuario(rawUsuario);

    const [jugadores, setJugadores] = useState([]);
    const [rondaActual, setRondaActual] = useState(1);
    const [totalRondas, setTotalRondas] = useState(3);
    const [tiempo, setTiempo] = useState(60);
    const [palabraSecreta, setPalabraSecreta] = useState("");
    const [longitudPalabra, setLongitudPalabra] = useState(0);
    const [dibujanteId, setDibujanteId] = useState("");
    const [resultadoFinal, setResultadoFinal] = useState(null);

    const miJugador = jugadores.find(j => j.id === socket.id || j.socketId === socket.id);
    const esMiTurno = Boolean(dibujanteId && socket.id ? dibujanteId === socket.id : miJugador?.dibujando);
    const partidaEnCurso = jugadores.some(j => j.dibujando);
    const cantidadGuiones = longitudPalabra || palabraSecreta.length;

    useEffect(() => {
        const unirseSala = () => {
            socket.emit('joinRoom', { room: salaId, usuario: nombreUsuario });
        };

        const manejarEstadoJuego = (datos) => {
            if (!datos) return;
            setResultadoFinal(null);
            setRondaActual(datos.rondaActual ?? 1);
            setTotalRondas(datos.totalRondas ?? 3);
            setDibujanteId(datos.dibujanteId || "");
            setPalabraSecreta(datos.palabraSecreta || "");
            setLongitudPalabra(datos.longitudPalabra ?? datos.palabraSecreta?.length ?? 0);
            if (typeof datos.tiempo === 'number') setTiempo(datos.tiempo);
        };

        const manejarTuPalabra = (palabra) => {
            if (palabra) {
                setPalabraSecreta(palabra);
                setLongitudPalabra(palabra.length);
            }
        };

        const manejarTiempo = (segundos) => {
            if (typeof segundos === 'number') setTiempo(segundos);
        };

        const manejarFinPartida = (datos) => {
            setResultadoFinal(datos?.top3 || []);
        };

        socket.on('actualizar_jugadores', setJugadores);
        socket.on('actualizar_estado_juego', manejarEstadoJuego);
        socket.on('tu_palabra', manejarTuPalabra);
        socket.on('actualizar_tiempo', manejarTiempo);
        socket.on('fin_partida', manejarFinPartida);
        socket.on('connect', unirseSala);

        if (socket.connected) unirseSala();

        return () => {
            socket.off('actualizar_jugadores', setJugadores);
            socket.off('actualizar_estado_juego', manejarEstadoJuego);
            socket.off('tu_palabra', manejarTuPalabra);
            socket.off('actualizar_tiempo', manejarTiempo);
            socket.off('fin_partida', manejarFinPartida);
            socket.off('connect', unirseSala);
        };
    }, [salaId, nombreUsuario]);

    const iniciarPartida = () => {
        socket.emit('iniciar_partida', { room: salaId });
    };

    const podioFinal = resultadoFinal
        ? (resultadoFinal.length > 0
            ? resultadoFinal
            : [...jugadores].sort((a, b) => b.puntos - a.puntos).slice(0, 3))
        : null;

    return (
        <div className={`${styles.gamePage} ${knewave.variable} ${hammersmithOne.variable} ${leagueSpartan.variable}`}>
            <header className={styles.gameHeader}>
                <div className={styles.headerBox}>
                    <span className={styles.headerLabel}>SALA</span>
                    <span className={styles.headerValue}>#{salaId}</span>
                </div>

                <div className={styles.headerBox}>
                    <span className={styles.headerLabel}>RONDA</span>
                    <span className={styles.headerValue}>{rondaActual} / {totalRondas}</span>
                </div>

                <div className={styles.headerBox}>
                    <span className={styles.headerLabel}>TIEMPO</span>
                    <span className={styles.timerValue}>{tiempo}s</span>
                </div>
            </header>

            <main className={styles.mainGrid}>
                {/* COLUMNA 1: JUGADORES */}
                <aside className={styles.playersCard}>
                    <h2 className={styles.playersHeader}>JUGADORES ({jugadores.length})</h2>

                    <ul className={styles.playersList}>
                        {jugadores.length > 0 ? (
                            jugadores.map((j, index) => (
                                <li
                                    key={j.id || index}
                                    className={`${styles.playerItem} ${j.dibujando ? styles.activePainter : ''}`}
                                >
                                    <div className={styles.playerInfo}>
                                        <span className={styles.playerName}>
                                            #{index + 1} {j.nombre}{' '}
                                            {j.esAnfitrion && '👑'}{' '}
                                            {j.dibujando && '✏️'}
                                        </span>
                                        <span className={styles.playerScore}>{j.puntos} pts</span>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className={styles.playerItem}>Cargando jugadores...</li>
                        )}
                    </ul>

                    {miJugador?.esAnfitrion && !partidaEnCurso && (
                        <div style={{ marginTop: '20px' }}>
                            <button
                                onClick={iniciarPartida}
                                disabled={!socket.connected || jugadores.length === 0}
                                style={{
                                    backgroundColor: '#ffcc70',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '14px 25px',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    width: '100%'
                                }}
                            >
                                ¡INICIAR JUEGO!
                            </button>
                        </div>
                    )}
                </aside>

                {/* COLUMNA 2: LIENZO Y BANNER */}
                <section className={styles.canvasSection}>
                    <div className={styles.wordBanner}>
                        {esMiTurno ? (
                            <p>
                                TU PALABRA: <strong>{palabraSecreta}</strong>
                            </p>
                        ) : (
                            <p>
                                PALABRA: <strong>{'_ '.repeat(cantidadGuiones)}</strong>
                            </p>
                        )}
                    </div>

                    <div className={styles.canvasWrapper}>
                        <Lienzo esMiTurno={esMiTurno} />
                    </div>
                </section>

                {/* COLUMNA 3: CHAT */}
                <aside className={styles.chatSection}>
                    <ChatJuego nombreUsuario={nombreUsuario} isPainter={esMiTurno} />
                </aside>
            </main>

            {/* PANTALLA DE RESULTADOS (TOP 3) */}
            {podioFinal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#9e9e9e',
                        borderRadius: '26px',
                        padding: '26px 32px 30px',
                        width: '100%',
                        maxWidth: '460px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
                        fontFamily: 'var(--font-hammersmith), var(--font-league-spartan), sans-serif'
                    }}>
                        <h2 style={{
                            margin: 0,
                            fontSize: '32px',
                            fontWeight: '900',
                            color: '#000000',
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                        }}>
                            RESULTADOS
                        </h2>

                        {[0, 1, 2].map((indice) => {
                            const jugador = podioFinal[indice];
                            return (
                                <div
                                    key={indice}
                                    style={{
                                        width: '100%',
                                        backgroundColor: COLORES_PODIO[indice],
                                        borderRadius: '9999px',
                                        padding: '14px 24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        color: '#000000',
                                        fontSize: '22px',
                                        fontWeight: '700',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span>{indice + 1}</span>
                                        <span>{jugador ? jugador.nombre : '—'}</span>
                                    </div>
                                    <span>{jugador ? `${jugador.puntos} pts` : ''}</span>
                                </div>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => {
                                window.location.href = `/principal?usuario=${encodeURIComponent(rawUsuario)}`;
                            }}
                            style={{
                                width: '100%',
                                backgroundColor: '#ffffff',
                                border: 'none',
                                borderRadius: '9999px',
                                padding: '14px 24px',
                                marginTop: '4px',
                                color: '#000000',
                                fontSize: '20px',
                                fontWeight: '800',
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                boxSizing: 'border-box'
                            }}
                        >
                            VOLVER AL INICIO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}