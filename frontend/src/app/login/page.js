"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Title from "../components/Title";
import Input from "../components/Input";
import Button from "../components/Button";
import styles from "./page.module.css";


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
                router.push("/");
                console.log("Ha ingresado con éxito")

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
        <div>
            <header id="a" className={styles.header}>
                <div className={styles.logo}>
                    <a href="#">MiSitio</a>
                </div>
                <nav className={styles.navigation}>
                    <a href="#">Inicio</a>
                    <a href="#">Servicios</a>
                    <a href="#">Productos</a>
                    <a href="#">Contacto</a>
                </nav>
            </header>
            <Title text="Iniciar Sesión" />
            <form onSubmit={handleSubmit}>
                <Input
                    label="Usuario"
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                />
                <Input
                    label="Contraseña"
                    type="password"
                    value={contraseña}
                    onChange={(e) => setContraseña(e.target.value)}
                />
                <Button text="Iniciar Sesión" type="submit" />
            </form>
        </div>
    );
}
