"use client"

import { useState, useEffect} from "react";
import { useRouter } from "next/navigation";

export default function Admin(){
    const [usuarios, setUsuarios] = useState([]);
    
    useEffect(() => {
        async function obtenerUsuarios() {
            try {
                const res = await fetch('http://localhost:4000/admin/usuarios'); 
                const data = await res.json();
                setUsuarios(data);
            } catch (error) {
                console.error("Error al obtener los usuarios:", error);
            }
        }

        obtenerUsuarios();
    }, []);

    return(<>
        <div>
            <h1>USUARIOS</h1>
            <h2>Traer usuarios</h2>
            <table>
                <thead>
                    <tr>
                        <th>usuario</th>
                        <th>contraseña</th>
                        <th>email</th>
                        <th>puntos_obtenidos</th>
                        <th>partidas_ganadas</th>
                        <th>es_admin</th>
                    </tr>
                </thead>
                <tbody id="tabla-usuarios">
                    {usuarios.map((u, index) => (
                            <tr key={u.id || index}>
                                <td>{u.usuario}</td>
                                <td>{u.contraseña}</td>
                                <td>{u.email}</td>
                                <td>{u.puntos_obtenidos}</td>
                                <td>{u.partidas_ganadas}</td>
                                <td>{u.es_admin ? "Sí" : "No"}</td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
        <div>

        </div>
        <div>
            
        </div>    
    </>)
}