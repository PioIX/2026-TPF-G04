'use client';

// npm install reactjs-popup

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Knewave, League_Spartan, Hammersmith_One } from 'next/font/google';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

// Configuración de las fuentes de Google Fonts
const knewave = Knewave({
  weight: '400',
  subsets: ['latin'],
});

const leagueSpartan = League_Spartan({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
});

const hammersmithOne = Hammersmith_One({
  weight: '400',
  subsets: ['latin'],
});

export default function PrincipalPage() {
  const [mejorPuntaje, setMejorPuntaje] = useState([]);
  const [masGanadas, setMasGanadas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para la sala y el popup
  const [isModalOpen, setIsModalOpenCrear] = useState(false);
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
  const handleOpenModalCrear = () => {
    setRoomCode(generateRoomCode());
    setPassword('');
    setIsModalOpenCrear(true);
  };

  // Enviar datos de la sala por Socket o API
  const handleCrearSala = (e) => {
    e.preventDefault();
    if (!password) return alert('Ingresa una contraseña para la sala');

    console.log('Creando sala con:', { roomCode, password });

    setIsModalOpenCrear(false);
  };

  return (
    <div className={`${styles.container} ${leagueSpartan.className}`}>
      <header className={styles.navbar}>
        <h1 className={`${styles.logo} ${knewave.className}`}>PINTUPIO</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.menu}>
          <button className={`${styles.menuLink} ${leagueSpartan.className}`}>
            INGRESAR A SALA
          </button>
          
          <button onClick={handleOpenModalCrear} className={`${styles.menuLink} ${leagueSpartan.className}`}>
            CREAR SALA
          </button>

          <button
            className={`${styles.btnJugar} ${knewave.className}`}
            onClick={handleJugar}
          >
            JUGAR
          </button>

          {/* <Link href="/" className={`${styles.menuLink} ${styles.volver} ${leagueSpartan.className}`}>
            Cerrar Sesión
          </Link> */}
        </section>

        <section className={styles.tablesContainer}>
          <div className={styles.cardTabla}>
            <div className={styles.tablaHeader}>
              <h2 className={leagueSpartan.className}>TABLA DE CLASIFICACIÓN</h2>
              <p className={hammersmithOne.className}>Usuarios con MEJOR PUNTAJE</p>
            </div>
            <table className={styles.tabla}>
              <tbody>
                {loading ? (
                  // ¿Qué es "colSpan"?
                  // Indica cuantas columnas debe ocupar la tabla
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
              <h2 className={knewave.className}>TABLA DE CLASIFICACIÓN</h2>
              <p className={hammersmithOne.className}>Usuarios con MÁS PARTIDAS GANADAS</p>
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

      {/* Modal para Crear Sala */}
      <Popup open={isModalOpen} onClose={() => setIsModalOpenCrear(false)} modal nested>
        {(close) => (
          <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', color: '#333' }}>
            <h2 className={knewave.className} style={{ marginBottom: '15px' }}>Crear Sala</h2>
            
            <form onSubmit={handleCrearSala} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className={hammersmithOne.className} style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Código de Sala (Auto-generado):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={roomCode}
                    readOnly
                    className={leagueSpartan.className}
                    style={{ padding: '8px', flex: 1, textTransform: 'uppercase', fontWeight: 'bold' }}
                  />
                  <button type="button" onClick={() => setRoomCode(generateRoomCode())}>
                    🔄
                  </button>
                </div>
              </div>

              <div>
                <label className={hammersmithOne.className} style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Contraseña:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Escribe la contraseña"
                  required
                  className={leagueSpartan.className}
                  style={{ padding: '8px', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className={leagueSpartan.className} style={{ padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Crear e Ingresar
                </button>
                <button type="button" onClick={close} className={leagueSpartan.className} style={{ padding: '8px 16px', cursor: 'pointer' }}>
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