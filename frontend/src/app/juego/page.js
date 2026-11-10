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
    const [color, setColor] = useState("#000000");
    const [grosor, setGrosor] = useState(5);

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
        };

        const recibirLimpiezaHandler = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };

        socket.on('recibir_trazo', recibirTrazoHandler);
        socket.on('recibir_limpieza', recibirLimpiezaHandler);

        return () => {
            socket.off('recibir_trazo', recibirTrazoHandler);
            socket.off('recibir_limpieza', recibirLimpiezaHandler);
        };
    }, []);

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
        if (!esMiTurno) return;
        dibujando.current = true;
        ultimo.current = posicion(event);
    }

    function parar() {
        dibujando.current = false;
    }

    function dibujar(event) {
        if (!esMiTurno || !dibujando.current || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext("2d");
        const actual = posicion(event);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = grosor;
        ctx.lineCap = "round";
        ctx.moveTo(ultimo.current.x, ultimo.current.y);
        ctx.lineTo(actual.x, actual.y);
        ctx.stroke();

        socket.emit('enviar_trazo', {
            desde: ultimo.current,
            hasta: actual,
            color,
            grosor
        });

        ultimo.current = actual;
    }

    function limpiar() {
        if (!esMiTurno) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        socket.emit('limpiar_canvas');
    }

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
                    cursor: esMiTurno ? "crosshair" : "not-allowed"
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
                    gap: '10px'
                }}>
                    <Input
                        type="color"
                        onChange={(e) => setColor(e.target.value)}
                        value={color}
                    />

                    <Input
                        type="range"
                        min="1"
                        max="15"
                        onChange={(e) => setGrosor(Number(e.target.value))}
                        value={grosor}
                    />

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

    const miJugador = jugadores.find(
        j => j.id === socket.id || j.socketId === socket.id
    );

    const esMiTurno = dibujanteId && socket.id
        ? dibujanteId === socket.id
        : (miJugador ? miJugador.dibujando : false);

    useEffect(() => {
        const manejarActualizacion = (listaJugadores) => {
            console.table(listaJugadores.map(j => ({
                nombre: j.nombre,
                id: j.id,
                socketId: j.socketId,
                esAnfitrion: j.esAnfitrion
            })));

            console.log("MI SOCKET:", socket.id);
            console.log("MI USUARIO:", nombreUsuario);

            setJugadores(listaJugadores);
        };

        const manejarEstadoJuego = (datos) => {
            if (!datos) return;

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

        const unirseSala = () => {
            socket.emit('joinRoom', {
                room: salaId,
                usuario: nombreUsuario
            });
        };

        // Primero registrar los eventos.
        socket.on('actualizar_jugadores', manejarActualizacion);
        socket.on('actualizar_estado_juego', manejarEstadoJuego);
        socket.on('tu_palabra', manejarTuPalabra);

        // Entrar a la sala al conectar y volver a entrar si Socket.IO
        // se reconecta después de una caída del servidor.
        socket.on('connect', unirseSala);

        if (socket.connected) {
            unirseSala();
        }

        return () => {
            socket.off('actualizar_jugadores', manejarActualizacion);
            socket.off('actualizar_estado_juego', manejarEstadoJuego);
            socket.off('tu_palabra', manejarTuPalabra);
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
        </div>
    );
}