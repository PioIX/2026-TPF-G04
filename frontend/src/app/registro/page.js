"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"
import Title from "../components/Title";
import Input from "../components/Input";
import Button from "../components/Button";


export default function RegistroPage() {
  // 1. Definimos los estados para cada campo
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Estructuramos los datos con las claves exactas que espera Express/Node.js
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
        console.log("Respuesta del servidor:", resultado);
        router.push("/login");
        // limpia el formulario
        setNombre("");
        setEmail("");
        setPassword("");
      } else {
        alert("Hubo un error al registrar el usuario.");
        console.error("Error del servidor:", resultado);
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      alert("No se pudo conectar con el servidor backend (revisá que esté corriendo en el puerto 4000).");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <Title text="Registro" />
        
        <form onSubmit={handleSubmit}>
          <Input 
            label="Nombre" 
            placeholder="Tu nombre" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
          <Input 
            label="Correo electrónico" 
            type="email" 
            placeholder="correo@ejemplo.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input 
            label="Contraseña" 
            type="password" 
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button text="Registrarse" />
        </form>
      </div>
    </main>
  );
}