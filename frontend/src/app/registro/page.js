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

export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    const datosUsuario = {
      usuario: nombre,
      contraseña: password,
      email: email,
      puntos_obtenidos: 0,
      partidas_ganadas: 0,
    };

    try {
      const respuesta = await fetch("http://localhost:4000/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosUsuario),
      });

      const resultado = await respuesta.json();

      if (respuesta.ok) {
        alert("¡Usuario registrado con éxito!");
        router.push("/login");
        setNombre("");
        setEmail("");
        setPassword("");
      } else {
        setError(resultado.mensaje || "Hubo un error al registrar el usuario.");
        setCargando(false);
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor (puerto 4000)");
      setCargando(false);
    }
  };

  return (
    <div
      className={`${styles.container} ${knewave.variable} ${hammersmithOne.variable} ${leagueSpartan.variable}`}
    >
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
          <Title text="REGISTRO" />

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>Nombre</label>
            <Input
              className={styles.input}
              type="text"
              placeholder="¿Cuál será tu nombre de usuario?"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />

            <label className={styles.label}>Correo electrónico</label>
            <Input
              className={styles.input}
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label className={styles.label}>Contraseña</label>
            <Input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className={styles.error}>{error}</p>}

            <Button
              text={cargando ? "REGISTRANDO..." : "REGISTRARSE"}
              type="submit"
            />
          </form>
        </div>
      </main>
    </div>
  );
}