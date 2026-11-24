// require('dotenv').config({ path: __dirname + '/.pio.env' })
require('dotenv').config({ path: __dirname + '/.home.env' });

var express = require('express'); //Tipo de servidor: Express
var bodyParser = require('body-parser'); //Convierte los JSON
var cors = require('cors');
const { realizarQuery } = require('./modulos/mysql');
const session = require('express-session');
const { Server } = require('socket.io');

var app = express(); //Inicializo express
var port = process.env.PORT || 4000; //Ejecuto el servidor en el puerto 4000

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(cors({
    origin: true,
    credentials: true
}));

const sessionMiddleware = session({
    secret: "supersarasa",
    resave: false,
    saveUninitialized: false
});

app.use(sessionMiddleware);

const server = app.listen(port, () => {
    console.log(`Servidor NodeJS corriendo en http://localhost:${port}/`);
});

app.get('/', function (req, res) {
    res.status(200).send({
        message: 'GET Home route working fine!'
    });
});

// --- RUTAS API REST ---

app.get('/usuarios', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`SELECT * FROM Usuarios`);
        res.status(200).json(respuesta);
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener usuarios"
        });
    }
});

app.get('/ranking/puntaje', async function (req, res) {
    try {
        let respuesta = await realizarQuery(
            `SELECT usuario, puntos_obtenidos FROM Usuarios WHERE LOWER(usuario) != 'admin' ORDER BY puntos_obtenidos DESC LIMIT 5`
        );
        res.status(200).json(respuesta);
    } catch (error) {
        res.status(500).json({ mensaje: "Error" });
    }
});

app.get('/ranking/ganadas', async function (req, res) {
    try {
        let respuesta = await realizarQuery(
            `SELECT usuario, partidas_ganadas FROM Usuarios WHERE LOWER(usuario) != 'admin' ORDER BY partidas_ganadas DESC LIMIT 5`
        );
        res.status(200).json(respuesta);
    } catch (error) {
        res.status(500).json({ mensaje: "Error" });
    }
});

app.post('/usuarios', async function (req, res) {
    try {
        await realizarQuery(
            `INSERT INTO Usuarios (usuario, contraseña, email, puntos_obtenidos, partidas_ganadas) VALUES ('${req.body.usuario}', '${req.body.contraseña}', '${req.body.email}', '${req.body.puntos_obtenidos}', '${req.body.partidas_ganadas}')`
        );
        res.status(201).json({
            mensaje: "Usuario creado con éxito"
        });
    } catch (error) {
        res.status(500).json({
            mensaje: "Error al crear usuario"
        });
    }
});

app.delete('/usuarios', async function (req, res) {
    try {
        await realizarQuery(
            `DELETE FROM Usuarios WHERE id = ${req.body.id}`
        );
        res.json({ message: "Usuario eliminado" });
    } catch (error) {
        res.status(500).json({
            mensaje: "Hubo un error"
        });
    }
});

app.put('/usuarios', async function (req, res) {
    try {
        await realizarQuery(
            `UPDATE Usuarios SET ${req.body.modificacion} = '${req.body.valor}' WHERE id = ${req.body.id}`
        );
        res.json({ message: "Usuario modificado" });
    } catch (error) {
        return res.status(500).json({
            mensaje: "Hubo un error"
        });
    }
});

app.post('/login', async function (req, res) {
    try {
        const { usuario, contraseña } = req.body;

        // Verifica que exista un usuario y una contraseña
        if (!usuario || !contraseña) {
            return res.status(400).json({
                mensaje: "Faltan datos"
            });
        }

        // Realiza query
        let resultado = await realizarQuery(
            `SELECT * FROM Usuarios WHERE usuario = '${usuario}' AND contraseña = '${contraseña}'`
        );

        // Si existe:
        if (resultado.length > 0) {
            const u = resultado[0];

            res.status(200).json({
                mensaje: "Login exitoso",
                usuario: {
                    id: u.id,
                    usuario: u.usuario,
                    email: u.email,
                    puntos_obtenidos: u.puntos_obtenidos,
                    partidas_ganadas: u.partidas_ganadas
                }
            });
        } else {
            res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }
    } catch (error) {
        res.status(500).json({
            mensaje: "Error en el servidor"
        });
    }
});

// PALABRAS //

app.get('/admin/palabras', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`SELECT * FROM Palabras`);
        res.status(200).json(respuesta);
    } catch (error) {
        res.status(500).json({ mensaje: "Error" });
    }
});

// --- SOCKET ---

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

const salas = {};

function detenerTemporizador(sala) {
    if (sala && sala.temporizador) {
        clearInterval(sala.temporizador);
        sala.temporizador = null;
    }
}

async function guardarPuntosPartida(room) {
    const sala = salas[room];
    if (!sala || sala.jugadores.length === 0) return [];

    const ranking = [...sala.jugadores].sort((a, b) => b.puntos - a.puntos);
    const ganador = ranking[0];

    try {
        // usuario_ganador es numérico: se guarda el id del ganador, no su nombre
        const ganadorDB = await realizarQuery(
            `SELECT * FROM Usuarios WHERE LOWER(usuario) = LOWER('${ganador.nombre}')`
        );
        const idGanador = ganadorDB.length > 0
            ? (ganadorDB[0].id_usuario || ganadorDB[0].id)
            : null;

        const resPartida = await realizarQuery(
            `INSERT INTO Partidas (rondas, usuario_ganador) VALUES (${sala.totalRondas}, ${idGanador})`
        );
        const idPartida = resPartida.insertId;

        for (const j of ranking) {
            const esGanador = j.nombre === ganador.nombre ? 1 : 0;

            await realizarQuery(
                `UPDATE Usuarios 
                SET puntos_obtenidos = COALESCE(puntos_obtenidos, 0) + ${j.puntos},
                    partidas_ganadas = COALESCE(partidas_ganadas, 0) + ${esGanador}
                WHERE LOWER(usuario) = LOWER('${j.nombre}')`
            );

            const userDB = await realizarQuery(
                `SELECT * FROM Usuarios WHERE LOWER(usuario) = LOWER('${j.nombre}')`
            );

            if (userDB.length > 0 && idPartida) {
                const idUsuario = userDB[0].id_usuario || userDB[0].id;
                if (idUsuario) {
                    await realizarQuery(
                        `INSERT INTO Puntos (id_usuario, id_partida, puntos_obtenidos)
                        VALUES (${idUsuario}, ${idPartida}, ${j.puntos})`
                    );
                }
            }
        }
    } catch (error) {
        console.error("Error al guardar puntos en MySQL:", error);
    }

    return ranking;
}

async function siguienteTurno(room) {
    const sala = salas[room];

    if (!sala || sala.jugadores.length === 0 || sala.estado !== "JUGANDO") return;

    // 1. Limpia el reloj anterior y marca este turno como el vigente
    detenerTemporizador(sala);
    const turnoId = (sala.turnoId = (sala.turnoId || 0) + 1);

    // 2. Si ya dibujaron todos los jugadores de la ronda, reinicia el índice y avanza de ronda
    if (sala.indiceTurno >= sala.jugadores.length) {
        sala.indiceTurno = 0;
        sala.rondaActual += 1;
    }

    // 3. Si ya se jugaron todas las rondas (ej: 3 rondas), termina la partida
    if (sala.rondaActual > sala.totalRondas) {
        sala.estado = "FINALIZADO";

        const ranking = await guardarPuntosPartida(room);

        io.to(room).emit('fin_partida', {
            mensaje: '¡La partida ha finalizado!',
            top3: ranking.slice(0, 3)
        });

        io.to(room).emit('actualizar_jugadores', sala.jugadores);
        return;
    }

    // 4. Elige una palabra aleatoria de MySQL
    let palabraElegida

    try {
        const resultado = await realizarQuery(
            `SELECT * FROM Palabras ORDER BY RAND() LIMIT 1`
        );

        if (resultado && resultado.length > 0) {
            const fila = resultado[0];

            if (fila.palabra) {
                palabraElegida = fila.palabra;
            } else {
                const valores = Object.values(fila);
                const valorTexto = valores.find(
                    v => typeof v === 'string' && isNaN(v)
                );

                if (valorTexto) {
                    palabraElegida = valorTexto;
                }
            }
        }
    } catch (error) {
        console.error("Error al consultar palabras:", error);
    }

    // Si mientras consultaba la palabra arrancó otro turno, este ya no vale
    if (salas[room] !== sala || sala.turnoId !== turnoId || sala.estado !== "JUGANDO") return;

    // 5. Configura los datos del nuevo turno y arranca el tiempo en 60 segundos
    sala.palabraSecreta = palabraElegida;
    sala.adivinadores = [];
    sala.tiempoRestante = 60;

    console.log(
        `[SALA #${room}] Ronda ${sala.rondaActual}/${sala.totalRondas} | Turno ${sala.indiceTurno + 1}/${sala.jugadores.length} | Palabra: "${sala.palabraSecreta}"`
    );

    // Asigna quién dibuja en estricto orden
    sala.jugadores.forEach((jugador, indice) => {
        jugador.dibujando = indice === sala.indiceTurno;
    });

    const dibujanteActual = sala.jugadores[sala.indiceTurno];

    // 6. Emite toda la información actualizada a la sala
    io.to(room).emit('actualizar_jugadores', sala.jugadores);

    io.to(room).emit('actualizar_estado_juego', {
        rondaActual: sala.rondaActual,
        totalRondas: sala.totalRondas,
        longitudPalabra: sala.palabraSecreta.length,
        dibujanteId: dibujanteActual.id,
        tiempo: sala.tiempoRestante
    });

    if (dibujanteActual && dibujanteActual.id) {
        io.to(dibujanteActual.id).emit('tu_palabra', sala.palabraSecreta);
    }

    io.to(room).emit('recibir_limpieza');
    io.to(room).emit('actualizar_tiempo', sala.tiempoRestante);

    // 7. Inicia la cuenta regresiva segundo a segundo
    const reloj = setInterval(() => {
        if (!salas[room] || sala.estado !== "JUGANDO" || sala.turnoId !== turnoId) {
            clearInterval(reloj);
            return;
        }

        sala.tiempoRestante -= 1;
        io.to(room).emit('actualizar_tiempo', sala.tiempoRestante);

        // Si el reloj llega a 0, avisa y pasa automáticamente al siguiente turno
        if (sala.tiempoRestante <= 0) {
            clearInterval(reloj);
            sala.temporizador = null;

            io.to(room).emit('recibir_mensaje', {
                usuario: 'Sistema',
                texto: `⏰ ¡Se acabó el tiempo! La palabra era: ${sala.palabraSecreta}`,
                isSystem: true
            });

            sala.indiceTurno += 1;
            siguienteTurno(room);
        }
    }, 1000);

    sala.temporizador = reloj;
}
// --- CONEXIONES ---

io.on("connection", (socket) => {

    socket.on('joinRoom', ({ room, usuario }) => {
        if (!room) return;

        socket.roomActual = room;

        if (!salas[room]) {
            salas[room] = {
                jugadores: [],
                estado: "ESPERANDO",
                rondaActual: 1,
                totalRondas: 3,
                indiceTurno: 0,
                palabraSecreta: "",
                adivinadores: [],
                tiempoRestante: 60,
                temporizador: null
            };
        }

        const sala = salas[room];
        const nombreLimpio = usuario?.toString().trim() || "Jugador";

        let jugador = sala.jugadores.find(
            j => j.nombre.toLowerCase() === nombreLimpio.toLowerCase()
        );

        if (jugador) {
            jugador.id = socket.id;
            jugador.socketId = socket.id;
        } else {
            jugador = {
                id: socket.id,
                socketId: socket.id,
                nombre: nombreLimpio,
                puntos: 0,
                dibujando: false,
                esAnfitrion: sala.jugadores.length === 0
            };

            sala.jugadores.push(jugador);
        }

        socket.join(room);

        if (!sala.jugadores.some(j => j.esAnfitrion === true)) {
            sala.jugadores[0].esAnfitrion = true;
        }

        if (sala.estado === "ESPERANDO") {
            const indiceAnfitrion = sala.jugadores.findIndex(
                j => j.esAnfitrion === true
            );

            if (indiceAnfitrion > 0) {
                const [anfitrion] = sala.jugadores.splice(indiceAnfitrion, 1);
                sala.jugadores.unshift(anfitrion);
            }
        }

        io.to(room).emit('actualizar_jugadores', sala.jugadores);
    });

    socket.on('iniciar_partida', ({ room }) => {
        const sala = salas[room];

        // Verificamos que exista la sala y esté esperando
        if (!sala || sala.estado !== "ESPERANDO") return;

        const jugador = sala.jugadores.find(j => j.id === socket.id);
        if (!jugador || !jugador.esAnfitrion) return;

        sala.estado = "JUGANDO";
        sala.indiceTurno = 0;
        sala.rondaActual = 1;

        // Arranca el primer turno y dispara el temporizador de 60s
        siguienteTurno(room);
    });

    socket.on('enviar_mensaje', (datosMensaje) => {
        const room = socket.roomActual;

        if (!room || !salas[room]) return;

        const sala = salas[room];
        const jugador = sala.jugadores.find(
            j => j.id === socket.id
        );

        if (!jugador || !datosMensaje?.texto) return;

        if (!sala.adivinadores) sala.adivinadores = [];

        if (sala.estado === "JUGANDO" && !jugador.dibujando) {
            const textoLimpio = datosMensaje.texto
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            const palabraLimpia = (sala.palabraSecreta || "")
                .trim()
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            if (sala.adivinadores.includes(jugador.nombre) && textoLimpio === palabraLimpia) {
                return;
            }

            if (
                textoLimpio === palabraLimpia &&
                palabraLimpia !== "" &&
                !sala.adivinadores.includes(jugador.nombre)
            ) {
                sala.adivinadores.push(jugador.nombre);
                const posicion = sala.adivinadores.length;

                const puntosAdivinador = Math.max(0, 4 - posicion);
                jugador.puntos += puntosAdivinador;

                if (posicion === 1) {
                    const dibujante = sala.jugadores.find(j => j.dibujando);
                    if (dibujante) {
                        dibujante.puntos += 5;
                    }
                }

                io.to(room).emit('recibir_mensaje', {
                    usuario: 'Sistema',
                    texto: `¡${jugador.nombre} adivinó en ${posicion}.º lugar! (+${puntosAdivinador} pts)${posicion === 1 ? ' | Dibujante +5 pts' : ''}`,
                    isSystem: true
                });

                io.to(room).emit('actualizar_jugadores', sala.jugadores);

                const totalAdivinadores = sala.jugadores.filter(j => !j.dibujando).length;
                if (sala.adivinadores.length >= totalAdivinadores) {
                    detenerTemporizador(sala);
                    sala.indiceTurno += 1;
                    siguienteTurno(room);
                }

                return;
            }
        }

        io.to(room).emit('recibir_mensaje', datosMensaje);
        io.to(room).emit('actualizar_jugadores', sala.jugadores);
    });

    socket.on('enviar_trazo', (datosTrazo) => {
        if (socket.roomActual) {
            socket.to(socket.roomActual).emit('recibir_trazo', datosTrazo);
        }
    });

    socket.on('limpiar_canvas', () => {
        if (socket.roomActual) {
            socket.to(socket.roomActual).emit('recibir_limpieza');
        }
    });

    socket.on('deshacer_trazo', () => {
        if (socket.roomActual) {
            socket.to(socket.roomActual).emit('recibir_deshacer');
        }
    });

    socket.on("disconnect", () => {
        const room = socket.roomActual;

        if (!room || !salas[room]) return;

        const sala = salas[room];
        const indiceDesconectado = sala.jugadores.findIndex(
            jugador => jugador.id === socket.id
        );

        if (indiceDesconectado === -1) return;

        const eraDibujante = sala.jugadores[indiceDesconectado].dibujando;

        sala.jugadores.splice(indiceDesconectado, 1);

        if (sala.jugadores.length === 0) {
            detenerTemporizador(sala);
            delete salas[room];
            return;
        }

        if (!sala.jugadores.some(j => j.esAnfitrion)) {
            sala.jugadores[0].esAnfitrion = true;
        }

        if (indiceDesconectado < sala.indiceTurno) {
            sala.indiceTurno -= 1;
        } else if (eraDibujante && sala.estado === "JUGANDO") {
            sala.indiceTurno = indiceDesconectado;

            if (sala.indiceTurno >= sala.jugadores.length) {
                sala.indiceTurno = 0;
            }
        }

        console.log("JUGADORES DE LA SALA:", sala.jugadores);
        io.to(room).emit('actualizar_jugadores', sala.jugadores);

        if (eraDibujante && sala.estado === "JUGANDO") {
            siguienteTurno(room);
        }
    });
});