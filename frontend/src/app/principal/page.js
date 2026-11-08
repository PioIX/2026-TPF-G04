'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Knewave, League_Spartan, Hammersmith_One } from 'next/font/google';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

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

  // Estados para Modal "CREAR SALA"
  const [isModalOpenCrear, setIsModalOpenCrear] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [password, setPassword] = useState('');

  // Estados para Modal "INGRESAR A SALA"
  const [isModalOpenIngresar, setIsModalOpenIngresar] = useState(false);
  const [codigoIngreso, setCodigoIngreso] = useState('');
  const [passIngreso, setPassIngreso] = useState('');

  const router = useRouter();

  const obtenerNombre = () => {
    if (typeof window !== 'undefined') {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      try {
        const datos = JSON.parse(usuarioGuardado);
        return datos.usuario || 'Jugador';
      } catch (e) {
        return usuarioGuardado; 
      }
    }
  }
  return 'Jugador';
  };

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

  // 1. Botón JUGAR (Unirse a sala pública por defecto)
  const handleJugar = () => {
    const usuario = obtenerNombre();
    router.push(`/juego?sala=PUBLIC_01&usuario=${encodeURIComponent(usuario)}`);
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

  const handleOpenModalCrear = () => {
    setRoomCode(generateRoomCode());
    setPassword('');
    setIsModalOpenCrear(true);
  };

  // 2. Confirmar CREAR SALA
  const handleCrearSala = (e) => {
    e.preventDefault();
    if (!password) return alert('Ingresa una contraseña para la sala');
    
    setIsModalOpenCrear(false);
    // Redirige al juego pasando el código generado
    const usuario = obtenerNombre();
    router.push(`/juego?sala=${roomCode}&usuario=${encodeURIComponent(usuario)}`);
  };

  // 3. Confirmar INGRESAR A SALA
  const handleIngresarSala = (e) => {
    e.preventDefault();
    if (!codigoIngreso.trim()) return alert('Ingresa un código de sala');

    setIsModalOpenIngresar(false);
    // Redirige a la sala especificada
    const usuario = obtenerNombre();
    router.push(`/juego?sala=${codigoIngreso.toUpperCase()}&usuario=${encodeURIComponent(usuario)}`);
  };

  return (
    <div className={`${styles.container} ${leagueSpartan.className}`}>
      <header className={styles.navbar}>
        <Link href="/" className={`${styles.logo} ${knewave.className}`}>PINTUPIO</Link>
      </header>

      <main className={styles.main}>
        <section className={styles.menu}>
          {/* INGRESAR A SALA */}
          <button 
            onClick={() => setIsModalOpenIngresar(true)} 
            className={`${styles.menuLink} ${leagueSpartan.className}`}
          >
            INGRESAR A SALA
          </button>
          
          {/* CREAR SALA */}
          <button 
            onClick={handleOpenModalCrear} 
            className={`${styles.menuLink} ${leagueSpartan.className}`}
          >
            CREAR SALA
          </button>

          {/* JUGAR DIRECTO */}
          <button
            className={`${styles.btnJugar} ${knewave.className}`}
            onClick={handleJugar}
          >
            JUGAR
          </button>
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

      {/* MODAL PARA CREAR SALA */}
      <Popup open={isModalOpenCrear} onClose={() => setIsModalOpenCrear(false)} modal nested>
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

      {/* MODAL PARA INGRESAR A SALA */}
      <Popup open={isModalOpenIngresar} onClose={() => setIsModalOpenIngresar(false)} modal nested>
        {(close) => (
          <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', color: '#333' }}>
            <h2 className={knewave.className} style={{ marginBottom: '15px' }}>Ingresar a una Sala</h2>
            
            <form onSubmit={handleIngresarSala} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className={hammersmithOne.className} style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Código de Sala:
                </label>
                <input
                  type="text"
                  value={codigoIngreso}
                  onChange={(e) => setCodigoIngreso(e.target.value)}
                  placeholder="Ej: ABCDE"
                  maxLength={5}
                  required
                  className={leagueSpartan.className}
                  style={{ padding: '8px', width: '100%', textTransform: 'uppercase' }}
                />
              </div>

              <div>
                <label className={hammersmithOne.className} style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                  Contraseña (si requiere):
                </label>
                <input
                  type="password"
                  value={passIngreso}
                  onChange={(e) => setPassIngreso(e.target.value)}
                  placeholder="Contraseña de la sala"
                  className={leagueSpartan.className}
                  style={{ padding: '8px', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className={leagueSpartan.className} style={{ padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Unirse
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