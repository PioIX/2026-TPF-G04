"use client";

import { useState, useEffect } from 'react';
import styles from '../app/page.module.css'; // Ajusta esta ruta según la ubicación de tu page.module.css

export default function ChatJuego({ nombreUsuario, isPainter, socket }) {
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
        if (!mensaje.trim() || isPainter || !socket) return;

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