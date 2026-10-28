import Link from "next/link";
import { Knewave } from 'next/font/google';
import styles from "./page.module.css";

const knewave = Knewave({
  weight: '400',
  subsets: ['latin'],
});

export default function Home() {
  return (
    <div className={styles.contenedor}>
      <img src="/banner.png" alt="Fondo" className={styles.imagenFondo} />

      <div className={styles.contenido}>
        <h1 className={knewave.className}>PINTUPIO</h1>

        <div className={styles.contenedorBotones}>
          <Link href="/login" className={styles.boton}>
            Iniciar sesión
          </Link>
          <Link href="/registro" className={styles.boton}>
            Registrarse
          </Link>
        </div>
      </div>
    </div>
  );
}