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

// Convierte una petición recibida (POST-GET...) a objeto JSON

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

// const server = app.listen(port, "0.0.0.0", () => {
//     console.log(`Servidor NodeJS corriendo en puerto ${port}`);
// });
const server = app.listen(port, () => {
    console.log(`Servidor NodeJS corriendo en http://localhost:${port}/`);
})

app.get('/', function (req, res) {
    res.status(200).send({
        message: 'GET Home route working fine!'
    });
});

// USUARIOS //
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
//// WHERE LOWER (usuario) != 'admin' para que el usuario admin no aparezca en el ranking
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

        if (!usuario || !contraseña) {
            return res.status(400).json({
                mensaje: "Faltan datos"
            });
        }

        let resultado = await realizarQuery(
            `SELECT * FROM Usuarios WHERE usuario = '${usuario}' AND contraseña = '${contraseña}'`
        );

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

// --- SOCKET  ---

const io = new Server(server, {
    cors: {
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

// Lista global de salas.
const salas = {};

// --- AGREGADO: GUARDAR PUNTOS EN MYSQL AL FINALIZAR ---
async function guardarPuntosPartida(room) {
    const sala = salas[room];
    if (!sala || sala.jugadores.length === 0) return [];

    const ranking = [...sala.jugadores].sort((a, b) => b.puntos - a.puntos);
    const ganador = ranking[0];

    try {
        const resPartida = await realizarQuery(
            `INSERT INTO Partidas (rondas, usuario_ganador) VALUES (${sala.totalRondas}, '${ganador.nombre}')`
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

// --- ELEGIR PALABRA Y ASIGNAR TURNO ---

async function siguienteTurno(room) {
    const sala = salas[room];

    if (!sala || sala.jugadores.length === 0) return;

    if (sala.indiceTurno >= sala.jugadores.length) {
        sala.indiceTurno = 0;
        sala.rondaActual += 1;
    }

    if (sala.rondaActual > sala.totalRondas) {
        sala.estado = "FINALIZADO";

        // AGREGADO: Guardar resultados en la base de datos y obtener ranking
        const ranking = await guardarPuntosPartida(room);

        io.to(room).emit('fin_partida', {
            mensaje: '¡La partida ha finalizado!',
            top3: ranking.slice(0, 3)
        });

        io.to(room).emit('actualizar_jugadores', sala.jugadores);

        return;
    }

    let palabraElegida = "PELOTA";

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

    sala.palabraSecreta = palabraElegida;
    sala.adivinadores = []; // AGREGADO: Reinicia el orden de adivinadores en cada turno

    console.log(
        `[SALA #${room}] Palabra asignada: "${sala.palabraSecreta}"`
    );

    // Asignar quién dibuja.
    sala.jugadores.forEach((jugador, indice) => {
        jugador.dibujando = indice === sala.indiceTurno;
    });

    const dibujanteActual = sala.jugadores[sala.indiceTurno];

    // Actualizar jugadores.
    io.to(room).emit(
        'actualizar_jugadores',
        sala.jugadores
    );

    // Actualizar estado del juego.
    io.to(room).emit('actualizar_estado_juego', {
        rondaActual: sala.rondaActual,
        totalRondas: sala.totalRondas,
        palabraSecreta: sala.palabraSecreta,
        dibujanteId: dibujanteActual.id
    });

    // Enviar la palabra al dibujante.
    if (dibujanteActual && dibujanteActual.id) {
        io.to(dibujanteActual.id).emit(
            'tu_palabra',
            sala.palabraSecreta
        );
    }

    // Limpiar el lienzo.
    io.to(room).emit('recibir_limpieza');
}

// --- CONEXIONES ---

io.on("connection", (socket) => {

    // UNIR JUGADOR A UNA SALA.
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
                adivinadores: [] // AGREGADO
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

        // Mientras la sala espera, el anfitrión siempre aparece primero.
        // El resto conserva el orden en el que se fue uniendo.
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

    // INICIAR PARTIDA: SOLO EL ANFITRIÓN.
    socket.on('iniciar_partida', ({ room }) => {

        const sala = salas[room];

        if (!sala || sala.estado !== "ESPERANDO") return;

        const jugador = sala.jugadores.find(
            j => j.id === socket.id
        );

        if (!jugador || !jugador.esAnfitrion) return;

        sala.estado = "JUGANDO";
        sala.indiceTurno = 0;
        sala.rondaActual = 1;

        siguienteTurno(room);
    });

    // ENVIAR MENSAJES Y ADIVINAR PALABRAS.
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
            // Si ya adivinó y vuelve a escribir la palabra, no se muestra en el chat
            if (sala.adivinadores.includes(jugador.nombre) && textoLimpio === palabraLimpia) {
                return;
            }

            if (
                textoLimpio === palabraLimpia &&
                palabraLimpia !== "" &&
                !sala.adivinadores.includes(jugador.nombre)
            ) {
                sala.adivinadores.push(jugador.nombre);
                const posicion = sala.adivinadores.length; // 1ro, 2do, 3ro, 4to...

                // 1ro -> +3 pts | 2do -> +2 pts | 3ro -> +1 pt | 4to+ -> 0 pts
                const puntosAdivinador = Math.max(0, 4 - posicion);
                jugador.puntos += puntosAdivinador;

                // El dibujante gana +5 puntos con el primer acierto
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

                io.to(room).emit(
                    'actualizar_jugadores',
                    sala.jugadores
                );

                // Si ya adivinaron todos los que no dibujan, pasamos al siguiente turno
                const totalAdivinadores = sala.jugadores.filter(j => !j.dibujando).length;
                if (sala.adivinadores.length >= totalAdivinadores) {
                    sala.indiceTurno += 1;
                    siguienteTurno(room);
                }

                return; // Evita que la palabra correcta aparezca escrita en el chat
            }
        }

        // Mostrar mensaje normal en el chat.
        io.to(room).emit(
            'recibir_mensaje',
            datosMensaje
        );

        io.to(room).emit(
            'actualizar_jugadores',
            sala.jugadores
        );
    });

    // ENVIAR TRAZOS.
    socket.on('enviar_trazo', (datosTrazo) => {

        if (socket.roomActual) {
            socket.to(socket.roomActual).emit(
                'recibir_trazo',
                datosTrazo
            );
        }
    });

    // LIMPIAR LIENZO.
    socket.on('limpiar_canvas', () => {

        if (socket.roomActual) {
            socket.to(socket.roomActual).emit(
                'recibir_limpieza'
            );
        }
    });
    // VOLVER HACIA ATRÁS EN EL TRAZO
    socket.on('deshacer_trazo', () => {
        if (socket.roomActual) {
            socket.to(socket.roomActual).emit('recibir_deshacer');
        }
    });

    // DESCONECTAR JUGADOR.
    socket.on("disconnect", () => {

        const room = socket.roomActual;

        if (!room || !salas[room]) return;

        const sala = salas[room];

        const indiceDesconectado = sala.jugadores.findIndex(
            jugador => jugador.id === socket.id
        );

        if (indiceDesconectado === -1) return;

        const eraDibujante =
            sala.jugadores[indiceDesconectado].dibujando;

        sala.jugadores.splice(indiceDesconectado, 1);

        // Si no quedan jugadores, eliminar la sala.
        if (sala.jugadores.length === 0) {
            delete salas[room];
            return;
        }

        // Si el anfitrión se fue, el primero pasa a serlo.
        if (!sala.jugadores.some(j => j.esAnfitrion)) {
            sala.jugadores[0].esAnfitrion = true;
        }

        // Ajustar el índice del turno.
        if (indiceDesconectado < sala.indiceTurno) {
            sala.indiceTurno -= 1;

        } else if (
            eraDibujante &&
            sala.estado === "JUGANDO"
        ) {
            sala.indiceTurno = indiceDesconectado;

            if (sala.indiceTurno >= sala.jugadores.length) {
                sala.indiceTurno = 0;
            }
        }

        console.log("JUGADORES DE LA SALA:", sala.jugadores);
        io.to(room).emit('actualizar_jugadores', sala.jugadores);

        // Si se desconectó el dibujante, continuar el juego.
        if (eraDibujante && sala.estado === "JUGANDO") {
            siguienteTurno(room);
        }
    });
});