'use client';

  // npm install reactjs-popup

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Knewave } from 'next/font/google';
import styles from './page.module.css';
<<<<<<< Updated upstream
=======
import { useRouter } from 'next/navigation';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
>>>>>>> Stashed changes

const knewave = Knewave({
  weight: '400',
  subsets: ['latin'],
});

export default function PrincipalPage() {
  const [mejorPuntaje, setMejorPuntaje] = useState([]);
  const [masGanadas, setMasGanadas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para la sala y el popup
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();

  useEffect(() => {
    async function cargarRanking() {
      try {
        const resPuntaje = await fetch('http://localhost:4000/ranking/puntaje');
        const dataPuntaje = await resPuntaje.json();

        const resGanadas = await fetch('http://localhost:4000/ranking/ganadas');
        const dataGanadas = await resGanadas.json();

        setMejorPuntaje(Array.isArray(dataPuntaje) ? dataPuntaje : []);
        setMasGanadas(Array.isArray(dataGanadas) ? dataGanadas : []);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      } finally {
        setLoading(false);
      }
    }

    cargarRanking();
  }, []);

<<<<<<< Updated upstream
=======
  const handleJugar = () => {
    router.push('/juego');
  };

  // Generador de código de 5 letras
  const generateRoomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Abrir modal y generar código automáticamente
  const handleOpenModal = () => {
    setRoomCode(generateRoomCode());
    setPassword('');
    setIsModalOpen(true);
  };

  // Enviar datos de la sala por Socket o API
  const handleCrearSala = (e) => {
    e.preventDefault();
    if (!password) return alert('Ingresa una contraseña para la sala');

    // Aquí emites tu evento de socket o haces la llamada a la API
    console.log('Creando sala con:', { roomCode, password });

    // Ejemplo con socket (si lo tienes instanciado):
    // socket.emit('create_room', { roomCode, password });

    setIsModalOpen(false);
    // router.push(`/sala/${roomCode}`); // Opcional: Redirigir a la sala
  };

>>>>>>> Stashed changes
  return (
    <div className={styles.container}>
      <header className={styles.navbar}>
        <h1 className={`${styles.logo} ${knewave.className}`}>PINTUPIO</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.menu}>
          <button className={`${styles.btnJugar} ${knewave.className}`}>JUGAR</button>
          <Link href="/ingresar-sala" className={styles.menuLink}>INGRESAR A SALA</Link>
          
          {/* Botón que abre el modal en lugar de la redirección */}
          <button onClick={handleOpenModal} className={styles.menuLink}>
            CREAR SALA
          </button>

          <Link href="/" className={`${styles.menuLink} ${styles.volver}`}>Cerrar Sesión</Link>
        </section>

        <section className={styles.tablesContainer}>
          <div className={styles.cardTabla}>
            <div className={styles.tablaHeader}>
              <h2>TABLA DE CLASIFICACIÓN</h2>
              <p>Usuario con MEJOR PUNTAJE</p>
            </div>
            <table className={styles.tabla}>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3">Cargando...</td></tr>
                ) : mejorPuntaje.length > 0 ? (
                  mejorPuntaje.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.usuario}</td>
                      <td>{item.puntos_obtenidos} pts</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.cardTabla}>
            <div className={styles.tablaHeader}>
              <h2>TABLA DE CLASIFICACIÓN</h2>
              <p>Usuario con MÁS PARTIDAS GANADAS</p>
            </div>
            <table className={styles.tabla}>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3">Cargando...</td></tr>
                ) : masGanadas.length > 0 ? (
                  masGanadas.map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.usuario}</td>
                      <td>{item.partidas_ganadas} ganadas</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modal para Crear Sala usando reactjs-popup */}
      <Popup open={isModalOpen} onClose={() => setIsModalOpen(false)} modal nested>
        {(close) => (
          <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', color: '#333' }}>
            <h2 className={knewave.className} style={{ marginBottom: '15px' }}>Crear Sala</h2>
            
            <form onSubmit={handleCrearSala} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Código de Sala (Auto-generado):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={roomCode}
                    readOnly
                    style={{ padding: '8px', flex: 1, textTransform: 'uppercase', fontWeight: 'bold' }}
                  />
                  <button type="button" onClick={() => setRoomCode(generateRoomCode())}>
                    🔄
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Contraseña:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Escribe la contraseña"
                  required
                  style={{ padding: '8px', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>
                  Crear e Ingresar
                </button>
                <button type="button" onClick={close} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </Popup>
    </div>
  );
}