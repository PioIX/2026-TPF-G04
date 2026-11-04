"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Title from "../components/Title";
import Input from "../components/Input";
import Button from "../components/Button";
import styles from "./page.module.css";
import { Hammersmith_One, League_Spartan } from "next/font/google";

const hammersmithOne = Hammersmith_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hammersmith",
});

const leagueSpartan = League_Spartan({
        subsets: ["latin"],
        weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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

                if(usuario ==="admin" && contraseña ==="admin67"){    
                    router.push("/admin")
                }else{
                    router.push("/principal");
                    console.log("Ha ingresado con éxito")

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
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <a href="#">PINTUPIO</a>
                </div>
                <nav className={styles.navigation}>
                    <a href="#">Iniciar sesión</a>
                    <a href="#">Registrarse</a>
                </nav>
            </header>

            <main className={styles.mainContent}>
                <div className={styles.formCard}>
                    <Title text="INICIAR SESIÓN" />
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <p className={styles.label}>Usuario</p>
                        <Input
                            className={styles.input}
                            type="text"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                        />
                        <p className={styles.label}>Contraseña</p>
                        <Input
                            className={styles.input}
                            type="password"
                            value={contraseña}
                            onChange={(e) => setContraseña(e.target.value)}
                        />
                        {error && <p style={{ color: "#ffcdd2" }}>{error}</p>}
                        <Button text="ENVIAR" type="submit" />
                    </form>
                </div>
            </main>
        </div>
    );
}
