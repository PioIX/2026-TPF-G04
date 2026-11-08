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
    const [puntoElegido, setPuntoElegido] = useState(null);
    const [datosPuntos, setDatosPuntos] = useState({
        id_usuario: "",
        id_partida: "",
        puntos_obtenidos: "",
    });
    const [nuevosPuntos, setNuevosPuntos] = useState({
        id_usuario: "",
        id_partida: "",
        puntos_obtenidos: "",
    });
    const [puntosAEliminar, setPuntosAEliminar] = useState("");

    //// Palabras
    const [palabras, setPalabras] = useState([]);
    const [palabraElegida, setPalabraElegida] = useState(null);
    const [datosPalabras, setDatosPalabras] = useState({ palabra: "" });
    const [nuevaPalabra, setNuevaPalabra] = useState({ palabra: "" });
    const [palabraAEliminar, setPalabraAEliminar] = useState("");

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
    useEffect(() => { obtenerUsuarios(); }, []);

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
        if (!usuarioElegido) {
            alert("Selecciona un usuario de la tabla para modificar.");
            return;
        }
        const nombreOriginal = usuarioElegido.usuario;

        fetch(`http://localhost:4000/admin/usuarios/${encodeURIComponent(nombreOriginal)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(datos),
        })
            .then(response => {
                if (response.ok) {
                    obtenerUsuarios();
                    setUsuarioElegido(null);
                    setDatos({ usuario: "", email: "", contraseña: "", puntos_obtenidos: 0, partidas_ganadas: 0, es_admin: false });
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

    function crearUsuario(e) {
        e.preventDefault();
        fetch('http://localhost:4000/admin/usuarios', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(nuevoUsuario),
        })
            .then(response => {
                if (!response.ok) throw new Error("Error al crear usuario");
                return response.json();
            })
            .then(data => {
                alert(data.mensaje || "Usuario creado con éxito");
                obtenerUsuarios();
                setNuevoUsuario({ usuario: "", email: "", contraseña: "", puntos_obtenidos: 0, partidas_ganadas: 0, es_admin: false });
            })
            .catch(error => console.error("Error al agregar el usuario:", error));
    }

    function eliminarUsuario(e) {
        e.preventDefault();
        if (!usuarioAEliminar) {
            alert("Por favor selecciona un usuario para eliminar.");
            return;
        }
        if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${usuarioAEliminar}"?`)) return;

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
                obtenerUsuarios();
                setUsuarioAEliminar("");
            })
            .catch(error => console.error("Error al eliminar el usuario:", error));
    }

    //// PARTIDAS
    async function obtenerPartidas() {
        try {
            const res = await fetch('http://localhost:4000/admin/partidas', { credentials: "include" });
            const data = await res.json();
            setPartidas(data);
        } catch (error) {
            console.error("Error al obtener las partidas:", error);
        }
    }
    useEffect(() => { obtenerPartidas(); }, []);

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
        if (!partidaElegida) {
            alert("Selecciona una partida de la tabla para modificar.");
            return;
        }
        const idOriginal = partidaElegida.id_partidas;

        fetch(`http://localhost:4000/admin/partidas/${idOriginal}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(datosPartida),
        })
            .then(response => {
                if (response.ok) {
                    obtenerPartidas();
                    setPartidaElegida(null);
                    setDatosPartida({ rondas: "", usuario_ganador: "" });
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
                obtenerPartidas();
                setPartidaAEliminar("");
            })
            .catch(error => console.error("Error al eliminar la partida:", error));
    }

    //// PUNTOS
    async function obtenerPuntos() {
        try {
            const res = await fetch('http://localhost:4000/admin/puntos', { credentials: "include" });
            const data = await res.json();
            setPuntos(data);
        } catch (error) {
            console.error("Error al obtener los puntos:", error);
        }
    }
    useEffect(() => { obtenerPuntos(); }, []);

    function elegirPuntos(p) {
        setPuntoElegido(p);
        setDatosPuntos({
            id_usuario: p.id_usuario ?? "",
            id_partida: p.id_partida ?? "",
            puntos_obtenidos: p.puntos_obtenidos ?? "",
        });
    }

    function cambiarDatosPuntos(e) {
        const { name, value } = e.target;
        setDatosPuntos({ ...datosPuntos, [name]: value });
    }

    function cambiarNuevosPuntos(e) {
        const { name, value } = e.target;
        setNuevosPuntos({ ...nuevosPuntos, [name]: value });
    }

    function guardarPuntos(e) {
        e.preventDefault();
        if (!puntoElegido) {
            alert("Selecciona un registro de puntos de la tabla para modificar.");
            return;
        }
        const idOriginal = puntoElegido.id || puntoElegido.id_puntos;

        fetch("http://localhost:4000/admin/puntos", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id: idOriginal, ...datosPuntos }),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.mensaje);
                obtenerPuntos();
                setPuntoElegido(null);
                setDatosPuntos({ id_usuario: "", id_partida: "", puntos_obtenidos: "" });
            })
            .catch(error => console.error("Error al modificar puntos:", error));
    }

    function crearPuntos(e) {
        e.preventDefault();
        fetch("http://localhost:4000/admin/puntos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(nuevosPuntos),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.mensaje);
                obtenerPuntos();
                setNuevosPuntos({ id_usuario: "", id_partida: "", puntos_obtenidos: "" });
            })
            .catch(error => console.error("Error al crear puntos:", error));
    }

    function eliminarPuntos(e) {
        e.preventDefault();
        if (!puntosAEliminar) return;

        fetch("http://localhost:4000/admin/puntos", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id: puntosAEliminar }),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.mensaje);
                obtenerPuntos();
                setPuntosAEliminar("");
            })
            .catch(error => console.error("Error al eliminar puntos:", error));
    }

    //// PALABRAS
    async function obtenerPalabras() {
        try {
            const res = await fetch('http://localhost:4000/admin/palabras', { credentials: "include" });
            const data = await res.json();
            setPalabras(data);
        } catch (error) {
            console.error("Error al obtener las palabras:", error);
        }
    }
    useEffect(() => { obtenerPalabras(); }, []);

    function elegirPalabra(p) {
        setPalabraElegida(p);
        setDatosPalabras({ palabra: p.palabra ?? "" });
    }

    function cambiarDatosPalabras(e) {
        const { name, value } = e.target;
        setDatosPalabras({ ...datosPalabras, [name]: value });
    }

    function cambiarNuevaPalabra(e) {
        const { name, value } = e.target;
        setNuevaPalabra({ ...nuevaPalabra, [name]: value });
    }

    function guardarPalabra(e) {
        e.preventDefault();
        if (!palabraElegida) {
            alert("Selecciona una palabra de la tabla para modificar.");
            return;
        }
        const idOriginal = palabraElegida.id_palabra || palabraElegida.id;

        fetch("http://localhost:4000/admin/palabras", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id: idOriginal, ...datosPalabras }),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.mensaje);
                obtenerPalabras();
                setPalabraElegida(null);
                setDatosPalabras({ palabra: "" });
            })
            .catch(error => console.error("Error al modificar la palabra:", error));
    }

    function crearPalabra(e) {
        e.preventDefault();
        fetch("http://localhost:4000/admin/palabras", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(nuevaPalabra),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.mensaje);
                obtenerPalabras();
                setNuevaPalabra({ palabra: "" });
            })
            .catch(error => console.error("Error al crear la palabra:", error));
    }

    function eliminarPalabra(e) {
        e.preventDefault();
        if (!palabraAEliminar) return;

        fetch("http://localhost:4000/admin/palabras", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ id: palabraAEliminar }),
        })
            .then(response => response.json())
            .then(data => {
                alert(data.mensaje);
                obtenerPalabras();
                setPalabraAEliminar("");
            })
            .catch(error => console.error("Error al eliminar la palabra:", error));
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Panel de Administración</h1>
            </header>

            <div className={styles.grid}>
                {/* USUARIOS */}
                <section className={styles.card}>
                    <h2 className={styles.sectionTitle}>Usuarios</h2>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Email</th>
                                    <th>Puntos</th>
                                    <th>Ganadas</th>
                                    <th>Rol</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usuarios.map((u, index) => (
                                    <tr
                                        key={`${u.usuario}-${index}`}
                                        onClick={() => elegirUsuario(u)}
                                        className={usuarioElegido?.usuario === u.usuario ? styles.selectedRow : ''}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td>{u.usuario}</td>
                                        <td>{u.email}</td>
                                        <td>{u.puntos_obtenidos}</td>
                                        <td>{u.partidas_ganadas}</td>
                                        <td>
                                            <span className={u.es_admin ? styles.badgeAdmin : styles.badgeUser}>
                                                {u.es_admin ? "Admin" : "User"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MODIFICAR USUARIO (SIEMPRE VISIBLE) */}
                    <div className={styles.formBlock}>
                        <h3 className={styles.subTitle}>
                            {usuarioElegido ? `Modificar Usuario (${usuarioElegido.usuario})` : "Modificar Usuario (Haz clic en una fila)"}
                        </h3>
                        <form className={styles.form} onSubmit={guardar}>
                            <input className={styles.input} name="usuario" value={datos.usuario ?? ''} onChange={cambiar} placeholder="Usuario" required />
                            <input className={styles.input} name="email" type="email" value={datos.email ?? ''} onChange={cambiar} placeholder="Email" required />
                            <input className={styles.input} name="contraseña" type="password" value={datos.contraseña ?? ''} onChange={cambiar} placeholder="Contraseña" required />
                            <input className={styles.input} name="puntos_obtenidos" type="number" value={datos.puntos_obtenidos ?? 0} onChange={cambiar} placeholder="Puntos" />
                            <input className={styles.input} name="partidas_ganadas" type="number" value={datos.partidas_ganadas ?? 0} onChange={cambiar} placeholder="Ganadas" />
                            <label className={styles.checkboxLabel}>
                                <input className={styles.checkbox} name="es_admin" type="checkbox" checked={datos.es_admin ?? false} onChange={cambiar} /> Es admin
                            </label>
                            <button className={styles.btnPrimary} type="submit">Guardar cambios</button>
                            {usuarioElegido && (
                                <button className={styles.btnSecondary} type="button" onClick={() => {
                                    setUsuarioElegido(null);
                                    setDatos({ usuario: "", email: "", contraseña: "", puntos_obtenidos: 0, partidas_ganadas: 0, es_admin: false });
                                }}>Cancelar</button>
                            )}
                        </form>
                    </div>

                    <div className={styles.formBlock}>
                        <h3 className={styles.subTitle}>Agregar usuario</h3>
                        <form className={styles.form} onSubmit={crearUsuario}>
                            <input className={styles.input} name="usuario" value={nuevoUsuario.usuario ?? ''} onChange={cambiarNuevo} placeholder="Usuario" required />
                            <input className={styles.input} name="email" type="email" value={nuevoUsuario.email ?? ''} onChange={cambiarNuevo} placeholder="Email" required />
                            <input className={styles.input} name="contraseña" type="password" value={nuevoUsuario.contraseña ?? ''} onChange={cambiarNuevo} placeholder="Contraseña" required />
                            <input className={styles.input} name="puntos_obtenidos" type="number" value={nuevoUsuario.puntos_obtenidos ?? 0} onChange={cambiarNuevo} placeholder="Puntos obtenidos" />
                            <input className={styles.input} name="partidas_ganadas" type="number" value={nuevoUsuario.partidas_ganadas ?? 0} onChange={cambiarNuevo} placeholder="Partidas ganadas" />
                            <label className={styles.checkboxLabel}>
                                <input className={styles.checkbox} name="es_admin" type="checkbox" checked={nuevoUsuario.es_admin ?? false} onChange={cambiarNuevo} /> Es admin
                            </label>
                            <button className={styles.btnPrimary} type="submit">Crear usuario</button>
                        </form>
                    </div>

                    <div className={styles.formBlock}>
                        <h3 className={styles.subTitle}>Eliminar usuario</h3>
                        <form className={styles.form} onSubmit={eliminarUsuario}>
                            <select className={styles.select} value={usuarioAEliminar ?? ''} onChange={(e) => setUsuarioAEliminar(e.target.value)} required>
                                <option value="" disabled>Selecciona un usuario a eliminar</option>
                                {usuarios.map((u, index) => (
                                    <option key={`del-${u.usuario}-${index}`} value={u.usuario}>
                                        {u.usuario} ({u.email})
                                    </option>
                                ))}
                            </select>
                            <button className={styles.btnDanger} type="submit">Eliminar usuario</button>
                        </form>
                    </div>
                </section>

                {/* PARTIDAS */}
                <section className={styles.card}>
                    <h2 className={styles.sectionTitle}>Partidas</h2>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Rondas</th>
                                    <th>Usuario Ganador</th>
                                </tr>
                            </thead>
                            <tbody>
                                {partidas.map((p, index) => (
                                    <tr
                                        key={`partida-${p.id_partidas || index}`}
                                        onClick={() => elegirPartida(p)}
                                        className={partidaElegida?.id_partidas === p.id_partidas ? styles.selectedRow : ''}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td>{p.id_partidas}</td>
                                        <td>{p.rondas}</td>
                                        <td>{p.usuario_ganador}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MODIFICAR PARTIDA (SIEMPRE VISIBLE) */}
                    <div className={styles.formBlock}>
                        <h3 className={styles.subTitle}>
                            {partidaElegida ? `Modificar Partida (ID: ${partidaElegida.id_partidas})` : "Modificar Partida (Haz clic en una fila)"}
                        </h3>
                        <form className={styles.form} onSubmit={guardarPartida}>
                            <input className={styles.input} name="rondas" type="number" value={datosPartida.rondas ?? ''} onChange={cambiarPartida} placeholder="Rondas" required />
                            <input className={styles.input} name="usuario_ganador" value={datosPartida.usuario_ganador ?? ''} onChange={cambiarPartida} placeholder="Usuario ganador" required />
                            <button className={styles.btnPrimary} type="submit">Guardar cambios</button>
                            {partidaElegida && (
                                <button className={styles.btnSecondary} type="button" onClick={() => {
                                    setPartidaElegida(null);
                                    setDatosPartida({ rondas: "", usuario_ganador: "" });
                                }}>Cancelar</button>
                            )}
                        </form>
                    </div>

                    <div className={styles.formBlock}>
                        <h3 className={styles.subTitle}>Agregar partidas</h3>
                        <form className={styles.form} onSubmit={crearPartida}>
                            <input className={styles.input} name="rondas" type="number" value={nuevaPartida.rondas ?? ''} onChange={cambiarNuevaPartida} placeholder="Cantidad de rondas" required />
                            <input className={styles.input} name="usuario_ganador" value={nuevaPartida.usuario_ganador ?? ''} onChange={cambiarNuevaPartida} placeholder="Usuario ganador" required />
                            <button className={styles.btnPrimary} type="submit">Crear partida</button>
                        </form>
                    </div>

                    <div className={styles.formBlock}>
                        <h3 className={styles.subTitle}>Eliminar partidas</h3>
                        <form className={styles.form} onSubmit={eliminarPartida}>
                            <select className={styles.select} value={partidaAEliminar ?? ''} onChange={(e) => setPartidaAEliminar(e.target.value)} required>
                                <option value="" disabled>Selecciona una partida a eliminar</option>
                                {partidas.map((p, index) => (
                                    <option key={`del-partida-${p.id_partidas || index}`} value={p.id_partidas}>
                                        Partida ID: {p.id_partidas} (Ganador: {p.usuario_ganador})
                                    </option>
                                ))}
                            </select>
                            <button className={styles.btnDanger} type="submit">Eliminar partida</button>
                        </form>
                    </div>
                </section>

                {/* PUNTOS */}
                <section className={styles.card}>
                    <h2 className={styles.sectionTitle}>Puntos</h2>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>ID Usuario</th>
                                    <th>ID Partida</th>
                                    <th>Puntos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {puntos.map((p, index) => (
                                    <tr
                                        key={`punto-${p.id || p.id_puntos || index}`}
                                        onClick={() => elegirPuntos(p)}
                                        className={(puntoElegido?.id || puntoElegido?.id_puntos) === (p.id || p.id_puntos) ? styles.selectedRow : ''}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td>{p.id || p.id_puntos}</td>
                                        <td>{p.id_usuario}</td>
                                        <td>{p.id_partida}</td>
                                        <td>{p.puntos_obtenidos}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MODIFICAR PUNTOS (SIEMPRE VISIBLE) */}
                    <div className={styles.formBlock}>
                        <h3 className={styles.subTitle}>
                            {puntoElegido ? `Modificar Puntos (ID: ${puntoElegido.id || puntoElegido.id_puntos})` : "Modificar Puntos (Haz clic en una fila)"}
                        </h3>
                        <form className={styles.form} onSubmit={guardarPuntos}>
                            <input className={styles.input} name="id_usuario" type="number" value={datosPuntos.id_usuario ?? ''} onChange={cambiarDatosPuntos} placeholder="ID Usuario" required />
                            <input className={styles.input} name="id_partida" type="number" value={datosPuntos.id_partida ?? ''} onChange={cambiarDatosPuntos} placeholder="ID Partida" required />
                            <input className={styles.input} name="puntos_obtenidos" type="number" value={datosPuntos.puntos_obtenidos ?? ''} onChange={cambiarDatosPuntos} placeholder="Puntos obtenidos" required />
                            <button className={styles.btnPrimary} type="submit">Guardar cambios</button>
                            {puntoElegido && (
                                <button className={styles.btnSecondary} type="button" onClick={() => {
                                    setPuntoElegido(null);
                                    setDatosPuntos({ id_usuario: "", id_partida: "", puntos_obtenidos: "" });
                                }}>Cancelar</button>
                            )}
                        </form>
                    </div>

                    <div className={styles.formBlock}>
                        <h3 className={styles.subTitle}>Agregar puntos</h3>
                        <form className={styles.form} onSubmit={crearPuntos}>
                            <input className={styles.input} name="id_usuario" type="number" value={nuevosPuntos.id_usuario ?? ''} onChange={cambiarNuevosPuntos} placeholder="ID Usuario" required />
                            <input className={styles.input} name="id_partida" type="number" value={nuevosPuntos.id_partida ?? ''} onChange={cambiarNuevosPuntos} placeholder="ID Partida" required />
                            <input className={styles.input} name="puntos_obtenidos" type="number" value={nuevosPuntos.puntos_obtenidos ?? ''} onChange={cambiarNuevosPuntos} placeholder="Puntos obtenidos" required />
                            <button className={styles.btnPrimary} type="submit">Crear puntos</button>
                        </form>
                    </div>

                    <div className={styles.formBlock}>
                        <h3 className={styles.subTitle}>Eliminar puntos</h3>
                        <form className={styles.form} onSubmit={eliminarPuntos}>
                            <select className={styles.select} value={puntosAEliminar ?? ''} onChange={(e) => setPuntosAEliminar(e.target.value)} required>
                                <option value="" disabled>Selecciona un registro a eliminar</option>
                                {puntos.map((p, index) => (
                                    <option key={`del-punto-${p.id || p.id_puntos || index}`} value={p.id || p.id_puntos}>
                                        Punto ID: {p.id || p.id_puntos} (Usuario: {p.id_usuario} - Puntos: {p.puntos_obtenidos})
                                    </option>
                                ))}
                            </select>
                            <button className={styles.btnDanger} type="submit">Eliminar puntos</button>
                        </form>
                    </div>
                </section>

                {/* PALABRAS */}
                <section className={styles.card}>
                    <h2 className={styles.sectionTitle}>Palabras</h2>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Palabra</th>
                                </tr>
                            </thead>
                            <tbody>
                                {palabras.map((p, index) => (
                                    <tr
                                        key={`palabra-${p.id_palabra || p.id || index}`}
                                        onClick={() => elegirPalabra(p)}
                                        className={(palabraElegida?.id_palabra || palabraElegida?.id) === (p.id_palabra || p.id) ? styles.selectedRow : ''}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td>{p.id_palabra || p.id}</td>
                                        <td>{p.palabra}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* MODIFICAR PALABRA (SIEMPRE VISIBLE) */}
                    <div className={styles.formBlock}>
                        <h3 className={styles.subTitle}>
                            {palabraElegida ? `Modificar Palabra (ID: ${palabraElegida.id_palabra || palabraElegida.id})` : "Modificar Palabra (Haz clic en una fila)"}
                        </h3>
                        <form className={styles.form} onSubmit={guardarPalabra}>
                            <input className={styles.input} name="palabra" value={datosPalabras.palabra ?? ''} onChange={cambiarDatosPalabras} placeholder="Palabra" required />
                            <button className={styles.btnPrimary} type="submit">Guardar cambios</button>
                            {palabraElegida && (
                                <button className={styles.btnSecondary} type="button" onClick={() => {
                                    setPalabraElegida(null);
                                    setDatosPalabras({ palabra: "" });
                                }}>Cancelar</button>
                            )}
                        </form>
                    </div>

                    <div className={styles.formBlock}>
                        <h3 className={styles.subTitle}>Agregar palabra</h3>
                        <form className={styles.form} onSubmit={crearPalabra}>
                            <input className={styles.input} name="palabra" value={nuevaPalabra.palabra ?? ''} onChange={cambiarNuevaPalabra} placeholder="Palabra" required />
                            <button className={styles.btnPrimary} type="submit">Crear palabra</button>
                        </form>
                    </div>

                    <div className={styles.formBlock}>
                        <h3 className={styles.subTitle}>Eliminar palabra</h3>
                        <form className={styles.form} onSubmit={eliminarPalabra}>
                            <select className={styles.select} value={palabraAEliminar ?? ''} onChange={(e) => setPalabraAEliminar(e.target.value)} required>
                                <option value="" disabled>Selecciona una palabra a eliminar</option>
                                {palabras.map((p, index) => (
                                    <option key={`del-palabra-${p.id_palabra || p.id || index}`} value={p.id_palabra || p.id}>
                                        Palabra ID: {p.id_palabra || p.id} ("{p.palabra}")
                                    </option>
                                ))}
                            </select>
                            <button className={styles.btnDanger} type="submit">Eliminar palabra</button>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
}