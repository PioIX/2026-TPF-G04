"use client";

import Title from "../components/Title";
import Input from "../components/Input";
import Button from "../components/Button";

export default function RegistroPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <Title text="Registro" />
        
        <form onSubmit={(e) => e.preventDefault()}>
          <Input label="Nombre" placeholder="Tu nombre" />
          <Input label="Correo electrónico" type="email" placeholder="correo@ejemplo.com" />
          <Input label="Contraseña" type="password" placeholder="••••••••" />
          
          <Button text="Registrarse" />
        </form>
      </div>
    </main>
  );
}