'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Knewave } from 'next/font/google';
import styles from './page.module.css';

const knewave = Knewave({
  weight: '400',
  subsets: ['latin'],
});

export default function PrincipalPage() {
  const [mejorPuntaje, setMejorPuntaje] = useState([]);
  const [masGanadas, setMasGanadas] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className={styles.container}>
      <header className={styles.navbar}>
        <h1 className={`${styles.logo} ${knewave.className}`}>PINTUPIO</h1>
      </header>

      <main className={styles.main}>
        <section className={styles.menu}>
          <button className={`${styles.btnJugar} ${knewave.className}`}>JUGAR</button>
          <Link href="/ingresar-sala" className={styles.menuLink}>INGRESAR A SALA</Link>
          <Link href="/crear-sala" className={styles.menuLink}>CREAR SALA</Link>
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
    </div>
  );
}