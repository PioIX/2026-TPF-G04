"use client"
import { useState, useEffect } from 'react';
import Lienzo from "../components/Lienzo";
import styles from './page.module.css';
import io from 'socket.io-client';

const socket = io('http://localhost:4000');

function ChatJuego({ nombreUsuario }) {
    const [mensaje, setMensaje] = useState('');
    const [historialChat, setHistorialChat] = useState([]);

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
        if (!mensaje.trim()) return;

        const datosMensaje = {
            usuario: nombreUsuario || 'Jugador',
            texto: mensaje,
    
        };

        setHistorialChat((prev) => [...prev, datosMensaje]);

        socket.emit('enviar_mensaje', datosMensaje);
        setMensaje('');

    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '10px', width: '300px' }}>
            <h2>Chat</h2>

            {/* Lista de mensajes */}
            <div style={{ height: '200px', overflowY: 'auto', marginBottom: '10px', background: '#f9f9f9', padding: '5px' }}>
                {historialChat.map((msg, index) => (
                    <div key={index} style={{ marginBottom: '5px' }}>
                        <strong style={{ color: '#000' }}>{msg.usuario}: </strong>
                        <span style={{ color: '#000' }}>{msg.texto}</span>

                    </div>
                ))}
            </div>


            <form onSubmit={enviarMensaje} style={{ display: 'flex', gap: '5px' }}>
                <input
                    type="text"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe algo..."
                    style={{ flex: 1 }}
                />
                <button type="submit">Enviar</button>
            </form>
        </div>
    );
}

export default function Page() {
    return (
        <div className={styles.juegoContainer}>
            <div className={styles.jugadores}></div>

            <div>
                <h1>SALA Nº</h1>
                <h1>RONDAS</h1>
                <Lienzo width={1000} height={400} />
            </div>

            <ChatJuego nombreUsuario="Jugador 1" />
        </div>
    );
}