"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Lienzo from "../components/Lienzo";
import ChatJuego from "../components/ChatJuego";
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
        return raw.replace(/['"]+/g, '').trim() || 'Jugador';
    }
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
                        <Lienzo esMiTurno={esMiTurno} socket={socket} />
                    </div>
                </section>

                {/* COLUMNA 3: CHAT */}
                <aside className={styles.chatSection}>
                    <ChatJuego
                        nombreUsuario={nombreUsuario}
                        isPainter={esMiTurno}
                        socket={socket}
                    />
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