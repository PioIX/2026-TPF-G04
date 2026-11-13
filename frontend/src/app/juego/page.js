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

// --- COMPONENTE LIENZO ---
function Lienzo({ esMiTurno }) {
    const canvasRef = useRef(null);
    const dibujando = useRef(false);
    const ultimo = useRef({ x: 0, y: 0 });
    const trazos = useRef([]);
    const trazoActual = useRef([]);

    const [color, setColor] = useState("#000000");
    const [grosor, setGrosor] = useState(5);
    const [herramienta, setHerramienta] = useState("lapiz"); // "lapiz" | "goma"

    function redibujarTodo(ctx, canvas, listaTrazos) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        listaTrazos.forEach((trazo) => {
            trazo.forEach((seg) => {
                ctx.beginPath();
                ctx.strokeStyle = seg.color;
                ctx.lineWidth = seg.grosor;
                ctx.lineCap = "round";
                ctx.moveTo(seg.desde.x, seg.desde.y);
                ctx.lineTo(seg.hasta.x, seg.hasta.y);
                ctx.stroke();
            });
        });
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        const recibirTrazoHandler = (data) => {
            ctx.beginPath();
            ctx.strokeStyle = data.color;
            ctx.lineWidth = data.grosor;
            ctx.lineCap = "round";
            ctx.moveTo(data.desde.x, data.desde.y);
            ctx.lineTo(data.hasta.x, data.hasta.y);
            ctx.stroke();

            if (data.nuevoTrazo || trazos.current.length === 0) {
                trazos.current.push([data]);
            } else {
                trazos.current[trazos.current.length - 1].push(data);
            }
        };

        const recibirLimpiezaHandler = () => {
            trazos.current = [];
            trazoActual.current = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };

        const recibirDeshacerHandler = () => {
            if (trazos.current.length > 0) {
                trazos.current.pop();
                redibujarTodo(ctx, canvas, trazos.current);
            }
        };

        socket.on('recibir_trazo', recibirTrazoHandler);
        socket.on('recibir_limpieza', recibirLimpiezaHandler);
        socket.on('recibir_deshacer', recibirDeshacerHandler);

        return () => {
            socket.off('recibir_trazo', recibirTrazoHandler);
            socket.off('recibir_limpieza', recibirLimpiezaHandler);
            socket.off('recibir_deshacer', recibirDeshacerHandler);
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

    function posicion(event) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const escalaX = canvas.width / rect.width;
        const escalaY = canvas.height / rect.height;

        return {
            x: (event.clientX - rect.left) * escalaX,
            y: (event.clientY - rect.top) * escalaY
        };
    }

    function empezar(event) {
        if (!esMiTurno || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");
        const pos = posicion(event);
        const colorActivo = herramienta === "goma" ? "#FFFFFF" : color;

        dibujando.current = true;
        ultimo.current = pos;

        const segmentoInicial = {
            desde: pos,
            hasta: pos,
            color: colorActivo,
            grosor
        };

        ctx.beginPath();
        ctx.strokeStyle = colorActivo;
        ctx.lineWidth = grosor;
        ctx.lineCap = "round";
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();

        trazoActual.current = [segmentoInicial];

        socket.emit('enviar_trazo', {
            ...segmentoInicial,
            nuevoTrazo: true
        });
    }

    function parar() {
        if (dibujando.current && trazoActual.current.length > 0) {
            trazos.current.push(trazoActual.current);
            trazoActual.current = [];
        }
        dibujando.current = false;
    }

    function dibujar(event) {
        if (!esMiTurno || !dibujando.current || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");
        const actual = posicion(event);
        const colorActivo = herramienta === "goma" ? "#FFFFFF" : color;

        const segmento = {
            desde: ultimo.current,
            hasta: actual,
            color: colorActivo,
            grosor
        };

        ctx.beginPath();
        ctx.strokeStyle = colorActivo;
        ctx.lineWidth = grosor;
        ctx.lineCap = "round";
        ctx.moveTo(ultimo.current.x, ultimo.current.y);
        ctx.lineTo(actual.x, actual.y);
        ctx.stroke();

        trazoActual.current.push(segmento);

        socket.emit('enviar_trazo', {
            ...segmento,
            nuevoTrazo: false
        });

        ultimo.current = actual;
    }

    function deshacer() {
        if (!esMiTurno || !canvasRef.current || trazos.current.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        trazos.current.pop();
        redibujarTodo(ctx, canvas, trazos.current);
        socket.emit('deshacer_trazo');
    }

    function limpiar() {
        if (!esMiTurno || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        trazos.current = [];
        trazoActual.current = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
        }}>
            <canvas
                ref={canvasRef}
                width={600}
                height={400}
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    cursor: esMiTurno ? (herramienta === "goma" ? "cell" : "crosshair") : "not-allowed"
                }}
                onMouseDown={empezar}
                onMouseUp={parar}
                onMouseLeave={parar}
                onMouseMove={dibujar}
            />

            {esMiTurno && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '10px'
                }}>
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

                    <Input
                        type="color"
                        onChange={(e) => {
                            setColor(e.target.value);
                            setHerramienta("lapiz");
                        }}
                        value={color}
                    />

                    <Input
                        type="range"
                        min="1"
                        max="30"
                        onChange={(e) => setGrosor(Number(e.target.value))}
                        value={grosor}
                    />

                    {/* BOTÓN FLECHA ATRÁS (DESHACER) */}
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
        {
            usuario: 'Sistema',
            texto: '¡Bienvenidos a la partida!',
            isSystem: true
        }
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
                        className={
                            msg.isSystem
                                ? styles.systemMessage
                                : styles.messageItem
                        }
                    >
                        <strong className={styles.msgUser}>
                            {msg.usuario}:
                        </strong>

                        <span className={styles.msgText}>
                            {msg.texto}
                        </span>
                    </div>
                ))}
            </div>

            <form onSubmit={enviarMensaje} className={styles.chatForm}>
                <input
                    type="text"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder={
                        isPainter
                            ? "Estás dibujando..."
                            : "Escribe tu respuesta..."
                    }
                    disabled={isPainter}
                />

                <button type="submit" disabled={isPainter}>
                    Enviar
                </button>
            </form>
        </div>
    );
}

// --- PÁGINA PRINCIPAL ---
export default function Page() {
    const searchParams = useSearchParams();

    const salaId = searchParams.get('sala') || "01";
    const rawUsuario = searchParams.get('usuario') || '';

    let nombreUsuario = 'Jugador';

    try {
        const parsed = JSON.parse(rawUsuario);
        nombreUsuario = (parsed.usuario || parsed).toString().trim();
    } catch (e) {
        nombreUsuario =
            rawUsuario.replace(/['"]+/g, '').trim() || 'Jugador';
    }

    const [jugadores, setJugadores] = useState([]);
    const [rondaActual, setRondaActual] = useState(1);
    const [totalRondas, setTotalRondas] = useState(3);
    const [tiempo] = useState(60);
    const [palabraSecreta, setPalabraSecreta] = useState("");
    const [dibujanteId, setDibujanteId] = useState("");
    const [podioFinal, setPodioFinal] = useState(null);

    const jugadoresRef = useRef([]);
    useEffect(() => {
        jugadoresRef.current = jugadores;
    }, [jugadores]);

    const miJugador = jugadores.find(
        j => j.id === socket.id || j.socketId === socket.id
    );

    const esMiTurno = dibujanteId && socket.id
        ? dibujanteId === socket.id
        : (miJugador ? miJugador.dibujando : false);

    useEffect(() => {
        const manejarActualizacion = (listaJugadores) => {
            setJugadores(listaJugadores);
        };

        const manejarEstadoJuego = (datos) => {
            if (!datos) return;

            setPodioFinal(null);
            setRondaActual(datos.rondaActual ?? 1);
            setTotalRondas(datos.totalRondas ?? 3);
            setDibujanteId(datos.dibujanteId || "");

            if (datos.palabraSecreta) {
                setPalabraSecreta(datos.palabraSecreta);
            }
        };

        const manejarTuPalabra = (palabra) => {
            if (palabra) {
                setPalabraSecreta(palabra);
            }
        };

        const manejarFinPartida = (datos) => {
            if (datos?.top3 && datos.top3.length > 0) {
                setPodioFinal(datos.top3);
            } else {
                const ordenados = [...jugadoresRef.current].sort((a, b) => b.puntos - a.puntos);
                setPodioFinal(ordenados.slice(0, 3));
            }
        };

        const unirseSala = () => {
            socket.emit('joinRoom', {
                room: salaId,
                usuario: nombreUsuario
            });
        };

        socket.on('actualizar_jugadores', manejarActualizacion);
        socket.on('actualizar_estado_juego', manejarEstadoJuego);
        socket.on('tu_palabra', manejarTuPalabra);
        socket.on('fin_partida', manejarFinPartida);
        socket.on('connect', unirseSala);

        if (socket.connected) {
            unirseSala();
        }

        return () => {
            socket.off('actualizar_jugadores', manejarActualizacion);
            socket.off('actualizar_estado_juego', manejarEstadoJuego);
            socket.off('tu_palabra', manejarTuPalabra);
            socket.off('fin_partida', manejarFinPartida);
            socket.off('connect', unirseSala);
        };
    }, [salaId, nombreUsuario]);

    const iniciarPartida = () => {
        socket.emit('iniciar_partida', { room: salaId });
    };

    return (
        <div className={`${styles.gamePage} ${knewave.variable} ${hammersmithOne.variable} ${leagueSpartan.variable}`}>

            <header className={styles.gameHeader}>
                <div className={styles.headerBox}>
                    <span className={styles.headerLabel}>SALA</span>
                    <span className={styles.headerValue}>#{salaId}</span>
                </div>

                <div className={styles.headerBox}>
                    <span className={styles.headerLabel}>RONDA</span>
                    <span className={styles.headerValue}>
                        {rondaActual} / {totalRondas}
                    </span>
                </div>

                <div className={styles.headerBox}>
                    <span className={styles.headerLabel}>TIEMPO</span>
                    <span className={styles.timerValue}>{tiempo}s</span>
                </div>
            </header>

            <main className={styles.mainGrid}>

                {/* COLUMNA 1: JUGADORES */}
                <aside className={styles.playersCard}>
                    <h2 className={styles.playersHeader}>
                        JUGADORES ({jugadores.length})
                    </h2>

                    <ul className={styles.playersList}>
                        {jugadores.length > 0 ? (
                            jugadores.map((j, index) => (
                                <li
                                    key={j.id || index}
                                    className={`${styles.playerItem} ${j.dibujando
                                        ? styles.activePainter
                                        : ''
                                        }`}
                                >
                                    <div className={styles.playerInfo}>
                                        <span className={styles.playerName}>
                                            #{index + 1} {j.nombre}{' '}
                                            {j.esAnfitrion && '👑'}{' '}
                                            {j.dibujando && '✏️'}
                                        </span>

                                        <span className={styles.playerScore}>
                                            {j.puntos} pts
                                        </span>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className={styles.playerItem}>
                                Cargando jugadores...
                            </li>
                        )}
                    </ul>

                    {miJugador?.esAnfitrion === true && (
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
                                PALABRA:{' '}
                                <strong>
                                    {'_ '.repeat(palabraSecreta.length)}
                                </strong>
                            </p>
                        )}
                    </div>

                    <div className={styles.canvasWrapper}>
                        <Lienzo esMiTurno={Boolean(esMiTurno)} />
                    </div>
                </section>

                {/* COLUMNA 3: CHAT */}
                <aside className={styles.chatSection}>
                    <ChatJuego
                        nombreUsuario={nombreUsuario}
                        isPainter={Boolean(esMiTurno)}
                    />
                </aside>

            </main>

            {/* PANTALLITA DE RESULTADOS (TOP 3) */}
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
                            const coloresPodio = [
                                '#f7941d',
                                '#bdbdbd',
                                '#a45a19'
                            ];

                            return (
                                <div
                                    key={indice}
                                    style={{
                                        width: '100%',
                                        backgroundColor: coloresPodio[indice],
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

                                    <span>
                                        {jugador ? `${jugador.puntos} pts` : ''}
                                    </span>
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