import Lienzo from "../components/Lienzo"; // Ajustá la ruta según la carpeta donde lo guardes
import styles from './page.module.css';

export default function Page() {
  return (
    <div className={styles.juegoContainer}>
      <div className={styles.jugadores}> </div>

      <div>
        <h1>Pizarra de Dibujo</h1>
        {/* Usás tu componente y le podés pasar medidas si querés */}
        <Lienzo width={1000} height={400} />
      </div>

      <div className={styles.chat}>
        <h2>Chat</h2>
      </div>


    </div>

  );
}