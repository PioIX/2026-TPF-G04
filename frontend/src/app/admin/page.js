"use client"

import { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function Admin() {
    //// Usuarios
    const [usuarios, setUsuarios] = useState([]);
    const [usuarioElegido, setUsuarioElegido] = useState(null);
    const [datos, setDatos] = useState({
        usuario: "",
        email: "",
        contraseña: "",
        puntos_obtenidos: 0,
        partidas_ganadas: 0,
        es_admin: false,
    });
    const [nuevoUsuario, setNuevoUsuario] = useState({
        usuario: "",
        email: "",
        contraseña: "",
        puntos_obtenidos: 0,
        partidas_ganadas: 0,
        es_admin: false,
    });
    const [usuarioAEliminar, setUsuarioAEliminar] = useState("");

    //// Partidas
    const [partidas, setPartidas] = useState([]);
    const [partidaElegida, setPartidaElegida] = useState(null);
    const [datosPartida, setDatosPartida] = useState({
        rondas: "",
        usuario_ganador: "",
    });
    const [nuevaPartida, setNuevaPartida] = useState({
        rondas: "",
        usuario_ganador: "",
    });
    const [partidaAEliminar, setPartidaAEliminar] = useState("");
    //// Puntos
    const [puntos, setPuntos] = useState([]);
    //// Palabras
    const [palabras, setPalabras] = useState([]);

    //// OBTENER USUARIOS
    async function obtenerUsuarios() {
        try {
            const res = await fetch('http://localhost:4000/admin/usuarios', { credentials: "include" });
            const data = await res.json();
            setUsuarios(data);
        } catch (error) {
            console.error("Error al obtener los usuarios:", error);
        }
    }
    useEffect(() => {
        obtenerUsuarios();
    }, []);

    ///// MODIFICAR USUARIO
    function elegirUsuario(u) {
        setUsuarioElegido(u);
        setDatos({
            usuario: u.usuario,
            email: u.email,
            contraseña: u.contraseña,
            puntos_obtenidos: u.puntos_obtenidos,
            partidas_ganadas: u.partidas_ganadas,
            es_admin: !!u.es_admin,
        });
    }

    function cambiar(e) {
        const { name, value, type, checked } = e.target;
        setDatos({ ...datos, [name]: type === "checkbox" ? checked : value });
    }

    function guardar(e) {
        e.preventDefault();
        if (!usuarioElegido) return;
        const nombreOriginal = usuarioElegido.usuario;

        fetch(`http://localhost:4000/admin/usuarios/${encodeURIComponent(nombreOriginal)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(datos),
        })
            .then(response => {
                if (response.ok) {
                    setUsuarios(usuarios.map(u =>
                        u.usuario === nombreOriginal ? { ...u, ...datos } : u
                    ));
                    setUsuarioElegido(null);
                }
                return response.json();
            })
            .then(data => alert(data.mensaje))
            .catch(error => console.error("Error al modificar el usuario:", error));
    }


    function cambiarNuevo(e) {
        const { name, value, type, checked } = e.target;
        setNuevoUsuario({
            ...nuevoUsuario,
            [name]: type === "checkbox" ? checked : value
        });
    }

    ///// AGREGAR USUARIO
    function crearUsuario(e) {
        e.preventDefault();

        fetch('http://localhost:4000/admin/usuarios', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(nuevoUsuario),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Error al crear usuario");
                }
                return response.json();
            })
            .then(data => {
                alert(data.mensaje || "Usuario creado con éxito");
                setUsuarios([...usuarios, nuevoUsuario]);
                setNuevoUsuario({
                    usuario: "",
                    email: "",
                    contraseña: "",
                    puntos_obtenidos: 0,
                    partidas_ganadas: 0,
                    es_admin: false,
                });
            })
            .catch(error => console.error("Error al agregar el usuario:", error));
    }
    ///// ELIMINAR USUARIO
    function eliminarUsuario(e) {
        e.preventDefault();
        if (!usuarioAEliminar) {
            alert("Por favor selecciona un usuario para eliminar.");
            return;
        }

        if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${usuarioAEliminar}"?`)) {
            return;
        }

        fetch(`http://localhost:4000/admin/usuarios/${encodeURIComponent(usuarioAEliminar)}`, {
            method: "DELETE",
            credentials: "include",
        })
            .then(response => {
                if (!response.ok) throw new Error("Error al eliminar");
                return response.json();
            })
            .then(data => {
                alert(data.mensaje);
                // Actualizamos la lista local filtrando al usuario borrado
                setUsuarios(usuarios.filter(u => u.usuario !== usuarioAEliminar));
                setUsuarioAEliminar(""); // Limpiamos la selección
            })
            .catch(error => console.error("Error al eliminar el usuario:", error));
    }
    ///// OBTENER PARTIDAS
    async function obtenerPartidas() {
        try {
            const res = await fetch('http://localhost:4000/admin/partidas', { credentials: "include" });
            const data = await res.json();
            setPartidas(data);
        } catch (error) {
            console.error("Error al obtener las partidas:", error);
        }
    }
    useEffect(() => {
        obtenerPartidas();
    }, []);
    ///// MODIFICAR PARTIDA
    function elegirPartida(p) {
        setPartidaElegida(p);
        setDatosPartida({
            rondas: p.rondas,
            usuario_ganador: p.usuario_ganador,
        });
    }

    function cambiarPartida(e) {
        const { name, value } = e.target;
        setDatosPartida({ ...datosPartida, [name]: value });
    }

    function guardarPartida(e) {
        e.preventDefault();
        if (!partidaElegida) return;
        const idOriginal = partidaElegida.id_partidas;

        fetch(`http://localhost:4000/admin/partidas/${idOriginal}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(datosPartida),
        })
            .then(response => {
                if (response.ok) {
                    setPartidas(partidas.map(p =>
                        p.id_partidas === idOriginal ? { ...p, ...datosPartida } : p
                    ));
                    setPartidaElegida(null);
                }
                return response.json();
            })
            .then(data => alert(data.mensaje))
            .catch(error => console.error("Error al modificar la partida:", error));
    }

    function cambiarNuevaPartida(e) {
        const { name, value } = e.target;
        setNuevaPartida({ ...nuevaPartida, [name]: value });
    }
    ///// AGREGAR PARTIDA
    function crearPartida(e) {
        e.preventDefault();
        fetch('http://localhost:4000/admin/partidas', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(nuevaPartida),
        })
            .then(response => {
                if (!response.ok) throw new Error("Error al crear partida");
                return response.json();
            })
            .then(data => {
                alert(data.mensaje || "Partida creada con éxito");
                obtenerPartidas();
                setNuevaPartida({ rondas: "", usuario_ganador: "" });
            })
            .catch(error => console.error("Error al agregar la partida:", error));
    }
    ///// ELIMINAR PARTIDA
    function eliminarPartida(e) {
        e.preventDefault();
        if (!partidaAEliminar) {
            alert("Por favor selecciona una partida para eliminar.");
            return;
        }
        if (!confirm(`¿Estás seguro de que deseas eliminar la partida ID ${partidaAEliminar}?`)) return;

        fetch(`http://localhost:4000/admin/partidas/${partidaAEliminar}`, {
            method: "DELETE",
            credentials: "include",
        })
            .then(response => {
                if (!response.ok) throw new Error("Error al eliminar");
                return response.json();
            })
            .then(data => {
                alert(data.mensaje);
                setPartidas(partidas.filter(p => String(p.id_partidas) !== String(partidaAEliminar)));
                setPartidaAEliminar("");
            })
            .catch(error => console.error("Error al eliminar la partida:", error));
    }

    ///// OBTENER PUNTOS
    async function obtenerPuntos() {
        try {
            const res = await fetch('http://localhost:4000/admin/puntos', { credentials: "include" });
            const data = await res.json();
            setPuntos(data);
        } catch (error) {
            console.error("Error al obtener los puntos:", error);
        }
    }
    useEffect(() => {
        obtenerPuntos();
    }, []);
    ///// OBTENER PALABRAS
    async function obtenerPalabras() {
        try {
            const res = await fetch('http://localhost:4000/admin/palabras', { credentials: "include" });
            const data = await res.json();
            setPalabras(data);
        } catch (error) {
            console.error("Error al obtener las palabras:", error);
        }
    }
    useEffect(() => {
        obtenerPalabras();
    }, []);
    return (<>
        {/* USUARIOS */}
        <div>
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
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map((u, index) => (
                            <tr
                                key={`${u.usuario}-${index}`}
                                onClick={() => elegirUsuario(u)} // 👈 Haces clic en toda la fila y se carga el form abajo
                                style={{ cursor: "pointer" }}
                            >
                                <td>{u.usuario}</td>
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
                <h2>Modificar usuarios</h2>
                <form onSubmit={guardar}>
                    <input name="usuario" value={datos.usuario} onChange={cambiar} placeholder="Usuario" required />
                    <input name="email" type="email" value={datos.email} onChange={cambiar} placeholder="Email" required />
                    <input name="contraseña" type="password" value={datos.contraseña} onChange={cambiar} placeholder="Contraseña" required />
                    <input name="puntos_obtenidos" type="number" value={datos.puntos_obtenidos} onChange={cambiar} />
                    <input name="partidas_ganadas" type="number" value={datos.partidas_ganadas} onChange={cambiar} />
                    <label>
                        <input name="es_admin" type="checkbox" checked={datos.es_admin} onChange={cambiar} /> Es admin
                    </label>
                    <button type="submit">Guardar cambios</button>
                    <button type="button" onClick={() => setUsuarioElegido(null)}>Cancelar</button>
                </form>
            </div>
            <div>
                <h2>Agregar usuarios</h2>
                <form onSubmit={crearUsuario}>
                    <input
                        name="usuario"
                        value={nuevoUsuario.usuario}
                        onChange={cambiarNuevo}
                        placeholder="Usuario"
                        required
                    />
                    <input
                        name="email"
                        type="email"
                        value={nuevoUsuario.email}
                        onChange={cambiarNuevo}
                        placeholder="Email"
                        required
                    />
                    <input
                        name="contraseña"
                        type="password"
                        value={nuevoUsuario.contraseña}
                        onChange={cambiarNuevo}
                        placeholder="Contraseña"
                        required
                    />
                    <input
                        name="puntos_obtenidos"
                        type="number"
                        value={nuevoUsuario.puntos_obtenidos}
                        onChange={cambiarNuevo}
                        placeholder="Puntos obtenidos"
                    />
                    <input
                        name="partidas_ganadas"
                        type="number"
                        value={nuevoUsuario.partidas_ganadas}
                        onChange={cambiarNuevo}
                        placeholder="Partidas ganadas"
                    />

                    <label>
                        <input
                            name="es_admin"
                            type="checkbox"
                            checked={nuevoUsuario.es_admin}
                            onChange={cambiarNuevo}
                        />
                        Es administrador
                    </label>

                    <button type="submit">Crear usuario</button>
                </form>

            </div>
            <div>
                <h2>Eliminar usuarios</h2>
                <form onSubmit={eliminarUsuario}>
                    <select
                        value={usuarioAEliminar}
                        onChange={(e) => setUsuarioAEliminar(e.target.value)}
                        required
                    >
                        <option value="" disabled>Selecciona un usuario a eliminar</option>
                        {usuarios.map((u, index) => (
                            <option key={`del-${u.usuario}-${index}`} value={u.usuario}>
                                {u.usuario} ({u.email})
                            </option>
                        ))}
                    </select>
                    <button type="submit">Eliminar usuario</button>
                </form>
            </div>
        </div>
        {/* PARTIDAS */}
        <div>
            <div>
                <h1>PARTIDAS</h1>
                <h2>Traer partidas</h2>
                <table>
                    <thead>
                        <tr>
                            <th>id_partidas</th>
                            <th>rondas</th>
                            <th>usuario_ganador</th>
                        </tr>
                    </thead>
                    <tbody>
                        {partidas.map((p, index) => (
                            <tr
                                key={`partida-${p.id_partidas || index}`}
                                onClick={() => elegirPartida(p)}
                                style={{ cursor: "pointer" }}
                            >
                                <td>{p.id_partidas}</td>
                                <td>{p.rondas}</td>
                                <td>{p.usuario_ganador}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {partidaElegida !== null && (
                    <div>
                        <h2>Modificar partida</h2>
                        <form onSubmit={guardarPartida}>
                            <input name="rondas" type="number" value={datosPartida.rondas} onChange={cambiarPartida} placeholder="Rondas" required />
                            <input name="usuario_ganador" value={datosPartida.usuario_ganador} onChange={cambiarPartida} placeholder="Usuario ganador" required />
                            <button type="submit">Guardar cambios</button>
                            <button type="button" onClick={() => setPartidaElegida(null)}>Cancelar</button>
                        </form>
                    </div>
                )}

                <div>
                    <h2>Agregar partidas</h2>
                    <form onSubmit={crearPartida}>
                        <input name="rondas" type="number" value={nuevaPartida.rondas} onChange={cambiarNuevaPartida} placeholder="Cantidad de rondas" required />
                        <input name="usuario_ganador" value={nuevaPartida.usuario_ganador} onChange={cambiarNuevaPartida} placeholder="Usuario ganador" required />
                        <button type="submit">Crear partida</button>
                    </form>
                </div>

                <div>
                    <h2>Eliminar partidas</h2>
                    <form onSubmit={eliminarPartida}>
                        <select
                            value={partidaAEliminar}
                            onChange={(e) => setPartidaAEliminar(e.target.value)}
                            required
                        >
                            <option value="" disabled>Selecciona una partida a eliminar</option>
                            {partidas.map((p, index) => (
                                <option key={`del-partida-${p.id_partidas || index}`} value={p.id_partidas}>
                                    Partida ID: {p.id_partidas} (Ganador: {p.usuario_ganador})
                                </option>
                            ))}
                        </select>
                        <button type="submit">Eliminar partida</button>
                    </form>
                </div>
            </div>
        </div>
        {/* PUNTOS */}
        <div>
            <div>
                <h1>PUNTOS</h1>
                <h2>Traer puntos</h2>
                <table>
                    <thead>
                        <tr>
                            <th>id_puntos</th>
                            <th>id_usuario</th>
                            <th>id_partida</th>
                            <th>puntos_obtenidos</th>
                        </tr>
                    </thead>
                </table>
            </div>
        </div>
        {/* PALABRAS */}
        <div>
            <div>
                <h1>PALABRAS</h1>
                <h2>Traer palabras</h2>
                <table>
                    <thead>
                        <tr>
                            <th>id_palabra</th>
                            <th>palabra</th>
                            <th>id_partida</th>
                        </tr>
                    </thead>
                </table>
            </div>
        </div>

    </>)
}