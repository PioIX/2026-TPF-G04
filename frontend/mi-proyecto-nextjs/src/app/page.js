import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {

  return (
    <div className={styles.contenedor}>
      {/* 1. Imagen que ocupa todo el fondo */}
      <img src="/banner.png" alt="Fondo" className={styles.imagenFondo} />

      {/* 2. Contenido que se coloca POR ENCIMA */}
      <div className={styles.contenido}>
        <h1 className={miFuentePersonalizada.className}>PINTUPIO</h1>

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