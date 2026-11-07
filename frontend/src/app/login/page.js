
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Title from "../components/Title";
import Input from "../components/Input";
import Button from "../components/Button";
import styles from "./page.module.css";
import { Knewave, Hammersmith_One, League_Spartan } from "next/font/google";

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

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const response = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuario, contraseña }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        if (usuario === "admin" && contraseña === "admin67") {
          router.push("/admin");
        } else {
          router.push("/principal");
          console.log("Ha ingresado con éxito");
          setUsuario("");
          setContraseña("");
        }
      } else {
        setError(data.mensaje || "Datos incorrectos");
        setCargando(false);
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor (puerto 4000)");
      setCargando(false);
    }
  };

  return (
    <div className={`${styles.container} ${knewave.variable} ${hammersmithOne.variable} ${leagueSpartan.variable}`}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <Link href="/" className={`${styles.logo} ${knewave.className}`}>PINTUPIO</Link>
        </div>

        <nav className={styles.navigation}>
          <Link href="/login">Iniciar sesión</Link>
          <Link href="/registro">Registrarse</Link>
        </nav>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.formCard}>
          <Title text="INICIAR SESIÓN" />

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>Usuario</label>

            <Input
              className={styles.input}
              type="text"
              value={usuario}
              placeholder="Ingrese su usuario"
              onChange={(e) => setUsuario(e.target.value)}
            />

            <label className={styles.label}>Contraseña</label>

            <Input
              className={styles.input}
              type="password"
              value={contraseña}
              placeholder="••••••••"
              onChange={(e) => setContraseña(e.target.value)}
            />

            {error && <p className={styles.error}>{error}</p>}

            <Button
              text={cargando ? "ENVIANDO..." : "ENVIAR"}
              type="submit"
            />
          </form>
        </div>
      </main>
    </div>
  );
}
