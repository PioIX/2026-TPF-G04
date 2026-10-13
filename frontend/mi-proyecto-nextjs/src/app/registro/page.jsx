"use client";

import { useState } from "react";
import Title from "../components/Title";
import Input from "../components/Input";
import Button from "../components/Button";

export default function RegistroPage() {
  // 1. Definimos los estados para cada campo
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes ver los datos en la consola o enviarlos a tu API
    console.log({ nombre, email, password });
    alert("¡Formulario enviado con éxito!");
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