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

const socket = io('http://localhost:4000');

// --- COMPONENTE LIENZO ---
function Lienzo({ socket }) {
    const canvasRef = useRef(null);
    const dibujando = useRef(false);
    const ultimo = useRef({ x: 0, y: 0 });
    const [color, setColor] = useState("#000000");
    const [grosor, setGrosor] = useState(5);

    useEffect(() => {
        if (!socket) return;
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
    }, [socket]);

    function posicion(event) {
        const canvas = canvasRef.current;
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

        if (socket) {
            socket.emit('enviar_trazo', {
                desde: ultimo.current,
                hasta: actual,
                color,
                grosor
            });
        }

        ultimo.current = actual;
    }

    function limpiar() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (socket) socket.emit('limpiar_canvas');
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <canvas 
                ref={canvasRef} 
                width={600} 
                height={400} 
                style={{ backgroundColor: "white", borderRadius: "8px", cursor: "crosshair" }}
                onMouseDown={empezar}
                onMouseUp={parar}
                onMouseLeave={parar}
                onMouseMove={dibujar}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Input type="color" onChange={(e) => setColor(e.target.value)} value={color} />
                <Input type="range" min="1" max="15" onChange={(e) => setGrosor(Number(e.target.value))} value={grosor} />
                <Button onClick={limpiar} txt="Limpiar" />
            </div>
        </div>
    );
}

// --- COMPONENTE CHAT ---
function ChatJuego({ nombreUsuario, isPainter, socket }) {
    const [mensaje, setMensaje] = useState('');
    const [historialChat, setHistorialChat] = useState([
        { usuario: 'Sistema', texto: '¡Bienvenidos a la partida!', isSystem: true }
    ]);

    useEffect(() => {
        if (!socket) return;
        const manejarNuevoMensaje = (nuevoMensaje) => {
            setHistorialChat((prev) => [...prev, nuevoMensaje]);
        };
        socket.on('recibir_mensaje', manejarNuevoMensaje);
        return () => socket.off('recibir_mensaje', manejarNuevoMensaje);
    }, [socket]);

    const enviarMensaje = (e) => {
        e.preventDefault();
        if (!socket || !mensaje.trim() || isPainter) return;

        const datosMensaje = {
            usuario: nombreUsuario || 'Jugador',
            texto: mensaje,
        };

        socket.emit('enviar_mensaje', datosMensaje);
        setMensaje('');
    };

    return (
        <div className={styles.chatCard}>
            <h2 className={styles.chatHeader}>CHAT</h2>
            <div className={styles.chatMessages}>
                {historialChat.map((msg, index) => (
                    <div key={index} className={msg.isSystem ? styles.systemMessage : styles.messageItem}>
                        <strong className={styles.msgUser}>{msg.usuario}: </strong>
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

// --- PÁGINA PRINCIPAL DEL JUEGO ---
export default function Page() {
    const searchParams = useSearchParams();
    
    // 1. Obtener ID de la Sala dinámico de la URL
    const salaId = searchParams.get('sala') || "01";

    // 2. Extraer nombre de usuario limpio (soporta JSON o string simple)
    const rawUsuario = searchParams.get('usuario') || '';
    let nombreUsuario = 'Jugador';
    try {
        const parsed = JSON.parse(rawUsuario);
        nombreUsuario = parsed.usuario || parsed;
    } catch (e) {
        nombreUsuario = rawUsuario || 'Jugador';
    }

    const [jugadores, setJugadores] = useState([]);
    const [rondaActual] = useState(1);
    const [totalRondas] = useState(3);
    const [tiempo] = useState(60);
    const [palabraSecreta] = useState("");

    const miJugador = jugadores.find(j => j.nombre === nombreUsuario);
    const esMiTurno = miJugador?.dibujando || false;

    useEffect(() => {
        if (!socket) return;

        // Unirse a la sala con el código y el usuario extraídos
        socket.emit('joinRoom', { room: salaId, usuario: nombreUsuario });

        // Recibir lista de jugadores en tiempo real desde el backend
        const manejarActualizacion = (listaJugadores) => {
            setJugadores(listaJugadores);
        };

        socket.on('actualizar_jugadores', manejarActualizacion);

        return () => {
            socket.off('actualizar_jugadores', manejarActualizacion);
        };
    }, [salaId, nombreUsuario]);

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
                {/* COLUMNA 1: JUGADORES (Conecta con el backend) */}
                <aside className={styles.playersCard}>
                    <h2 className={styles.playersHeader}>JUGADORES ({jugadores.length})</h2>
                    <ul className={styles.playersList}>
                        {jugadores.length > 0 ? (
                            jugadores.map((j, index) => (
                                <li key={j.id || index} className={`${styles.playerItem} ${j.dibujando ? styles.activePainter : ''}`}>
                                    <div className={styles.playerInfo}>
                                        <span className={styles.playerName}>
                                            #{index + 1} {j.nombre} {j.esCreador && '👑'} {j.dibujando && '✏️'}
                                        </span>
                                        <span className={styles.playerScore}>{j.puntos} pts</span>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className={styles.playerItem}>Cargando jugadores...</li>
                        )}
                    </ul>
                </aside>

                {/* COLUMNA 2: LIENZO */}
                <section className={styles.canvasSection}>
                    <div className={styles.wordBanner}>
                        {esMiTurno ? (
                            <p>TU PALABRA: <strong>{palabraSecreta}</strong></p>
                        ) : (
                            <p>PALABRA: <strong>{'_ '.repeat(palabraSecreta.length)}</strong></p>
                        )}
                    </div>
                    <div className={styles.canvasWrapper}>
                        <Lienzo socket={socket} />
                    </div>
                </section>

                {/* COLUMNA 3: CHAT */}
                <aside className={styles.chatSection}>
                    <ChatJuego nombreUsuario={nombreUsuario} isPainter={esMiTurno} socket={socket} />
                </aside>
            </main>
        </div>
    );
}