"use client";

import { useState, useEffect, useRef } from 'react';
import Button from "../components/Button";
import Input from "../components/Input";
import styles from './page.module.css';
import io from 'socket.io-client';
import { Knewave, Hammersmith_One, League_Spartan } from "next/font/google";

// Configuración de Fuentes
const knewave = Knewave({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-knewave",
});

const hammersmithOne = Hammersmith_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hammersmith",
});

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-league-spartan",
});

const socket = io('http://localhost:4000');

// --- COMPONENTE TUYO: LIENZO DE DIBUJO ---
function Lienzo() {
    const [todolisto, settl] = useState(false);
    const [color, setColor] = useState("#000000");
    const [grosor, setGrosor] = useState(5);
    const canvasRef = useRef(null);
    const dibujando = useRef(false);
    const ultimo = useRef({ x: 0, y: 0 });

    function empezar(event) {
        dibujando.current = true;
        ultimo.current = posicion(event);
    }

    function parar() {
        dibujando.current = false;
    }

    function posicion(event) {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect(); // devuelve la posición
        const escalaX = canvas.width / rect.width;
        const escalaY = canvas.height / rect.height;
        return {
            x: (event.clientX - rect.left) * escalaX,
            y: (event.clientY - rect.top) * escalaY,
        };
    }

    function dibujar(event) {
        if (!dibujando.current) return;
        const ctx = canvasRef.current.getContext("2d");
        const actual = posicion(event);

        // magia
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = grosor;
        ctx.lineCap = "round";
        ctx.moveTo(ultimo.current.x, ultimo.current.y);
        ctx.lineTo(actual.x, actual.y);
        ctx.stroke();
        // magia

        ultimo.current = actual;
    }

    function limpiar() {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function terminar() {
        const guardado = canvasRef.current.toDataURL("image/png", 0.8);
        finStep({ link: guardado });
    }

    const colorSetter = (event) => {
        setColor(event.target.value);
    };

    const grosorSetter = (event) => {
        setGrosor(Number(event.target.value));
    };

    async function finStep(datos) {
        const response = await fetch("http://localhost:4000/BlobPost", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos),
        });
        const texto = await response.text();
        console.log(response.status, texto);
        settl(true);
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
                <Input type="color" onChange={colorSetter} />
                <Input type="range" min="1" max="15" onChange={grosorSetter} />
                <Button onClick={limpiar} txt="Limpiar" />
                <Button onClick={terminar} txt="TODO LISTO" />
            </div>
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
        socket.on('recibir_mensaje', (nuevoMensaje) => {
            setHistorialChat((prev) => [...prev, nuevoMensaje]);
        });

        return () => {
            socket.off('recibir_mensaje');
        };
    }, []);

    const enviarMensaje = (e) => {
        e.preventDefault();
        if (!mensaje.trim() || isPainter) return;

        const datosMensaje = {
            usuario: nombreUsuario || 'Jugador',
            texto: mensaje,
        };

        setHistorialChat((prev) => [...prev, datosMensaje]);
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

// --- PÁGINA PRINCIPAL COMPLETA ---
export default function Page() {
    const [salaId] = useState("01");
    const [rondaActual] = useState(1);
    const [totalRondas] = useState(3);
    const [tiempo] = useState(60);
    const [palabraSecreta] = useState("COHETE");
    const [esMiTurno] = useState(false);

    const [jugadores] = useState([
        { id: 1, nombre: 'Jugador 1', puntos: 120, dibujando: true },
        { id: 2, nombre: 'Jugador 2', puntos: 85, dibujando: false },
        { id: 3, nombre: 'Jugador 3', puntos: 40, dibujando: false },
    ]);

    return (
        <div className={`${styles.gamePage} ${knewave.variable} ${hammersmithOne.variable} ${leagueSpartan.variable}`}>
            {/* ENCABEZADO SUPERIOR */}
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

            {/* ESTRUCTURA PRINCIPAL DE 3 COLUMNAS */}
            <main className={styles.mainGrid}>
                
                {/* COLUMNA 1: JUGADORES */}
                <aside className={styles.playersCard}>
                    <h2 className={styles.playersHeader}>JUGADORES</h2>
                    <ul className={styles.playersList}>
                        {jugadores.map((j) => (
                            <li key={j.id} className={`${styles.playerItem} ${j.dibujando ? styles.activePainter : ''}`}>
                                <div className={styles.playerInfo}>
                                    <span className={styles.playerName}>{j.nombre} {j.dibujando && '✏️'}</span>
                                    <span className={styles.playerScore}>{j.puntos} pts</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* COLUMNA 2: PALABRA Y TU LIENZO DE DIBUJO */}
                <section className={styles.canvasSection}>
                    <div className={styles.wordBanner}>
                        {esMiTurno ? (
                            <p>TU PALABRA: <strong>{palabraSecreta}</strong></p>
                        ) : (
                            <p>PALABRA: <strong>{'_ '.repeat(palabraSecreta.length)}</strong></p>
                        )}
                    </div>
                    <div className={styles.canvasWrapper}>
                        <Lienzo />
                    </div>
                </section>

                {/* COLUMNA 3: CHAT */}
                <aside className={styles.chatSection}>
                    <ChatJuego nombreUsuario="Jugador 1" isPainter={esMiTurno} />
                </aside>

            </main>
        </div>
    );
}