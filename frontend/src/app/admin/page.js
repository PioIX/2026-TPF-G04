"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Admin(){
    
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

                </tbody>
            </table>
        </div>
        <div>


        </div>
        <div>
            
        </div>    
    </>)
}