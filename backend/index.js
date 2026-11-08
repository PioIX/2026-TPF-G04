// require('dotenv').config({ path: __dirname + '/.pio.env' })
require('dotenv').config({ path: __dirname + '/.home.env' })

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
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
}));

// Reconoce al usuario que inició sesión
const sessionMiddleware = session({
    secret: "supersarasa",
    resave: false,
    saveUninitialized: false,
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


///////////// Usuarios

app.get('/usuarios', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`SELECT * FROM Usuarios`)
        res.status(200).json(respuesta)
    } catch (error) {
        console.error("Error en /usuarios:", error)
        res.status(500).json({ mensaje: "Hubo un error al obtener los usuarios" })
    }
});


// Obtener TOP 5 usuarios con MEJOR PUNTAJE
app.get('/ranking/puntaje', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`
            SELECT usuario, puntos_obtenidos 
            FROM Usuarios 
            ORDER BY puntos_obtenidos DESC 
            LIMIT 5
        `);
        res.status(200).json(respuesta);
    } catch (error) {
        console.error("Error en /ranking/puntaje:", error);
        res.status(500).json({ mensaje: "Hubo un error al obtener el ranking de puntos" });
    }
});

// Obtener TOP 5 usuarios con MÁS PARTIDAS GANADAS
app.get('/ranking/ganadas', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`
            SELECT usuario, partidas_ganadas 
            FROM Usuarios 
            ORDER BY partidas_ganadas DESC 
            LIMIT 5
        `);
        res.status(200).json(respuesta);
    } catch (error) {
        console.error("Error en /ranking/ganadas:", error);
        res.status(500).json({ mensaje: "Hubo un error al obtener el ranking de victorias" });
    }
});

//Se agrega un nuevo usuario
app.post('/usuarios', async function (req, res) {
    try {
        await realizarQuery(`INSERT INTO Usuarios (usuario, contraseña, email, puntos_obtenidos, partidas_ganadas) VALUES
            ('${req.body.usuario}', '${req.body.contraseña}', '${req.body.email}', '${req.body.puntos_obtenidos}', '${req.body.partidas_ganadas}')`);
        res.status(201).json({ mensaje: "Usuario creado con éxito" });
    } catch (error) {
        console.error("Error en /usuarios:", error);
        res.status(500).json({ mensaje: "Hubo un error al crear el usuario" });
    }
});

//Elimina el usuario segun su id
app.delete('/usuarios', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`DELETE FROM Usuarios WHERE id = ${req.body.id}`)
        res.json({ message: "Usuario eliminado" })
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Hubo un error" });
    }
})

//Modifica datos del usuario
app.put('/usuarios', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`UPDATE Usuarios SET ${req.body.modificacion} = '${req.body.valor}' WHERE id = ${req.body.id}`)
        res.json({ message: "Usuario modificado" })
    } catch (error) {
        return ("Hubo un error")
    }
})


///////// LOGIN
app.post('/login', async function (req, res) {
    try {
        const { usuario, contraseña } = req.body;

        // Validamos que se completen los campos
        if (!usuario || !contraseña) {
            return res.status(400).json({ mensaje: "Por favor ingresa usuario y contraseña" });
        }

        // Busca si ya existe un usuario con esa contraseña
        let resultado = await realizarQuery(
            `SELECT * FROM Usuarios WHERE usuario = '${usuario}' AND contraseña = '${contraseña}'`
        );

        if (resultado.length > 0) {
            const usuarioEncontrado = resultado[0];
            res.status(200).json({
                mensaje: "Login exitoso",
                usuario: {
                    id: usuarioEncontrado.id,
                    usuario: usuarioEncontrado.usuario,
                    email: usuarioEncontrado.email,
                    puntos_obtenidos: usuarioEncontrado.puntos_obtenidos,
                    partidas_ganadas: usuarioEncontrado.partidas_ganadas

                }
            });
        } else {
            res.status(401).json({ mensaje: "Usuario o contraseña incorrectos" });
        }


    } catch (error) {
        console.error("Error en /login:", error);
        res.status(500).json({ mensaje: "Error en el servidor al intentar iniciar sesión" });
    }
});

///ADMIN
//  USUARIOS
//Traemos todo de los usuarios
app.get('/admin/usuarios', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`SELECT * FROM Usuarios`)
        res.status(200).json(respuesta)
    } catch (error) {
        console.error("Error en /usuarios:", error)
        res.status(500).json({ mensaje: "Hubo un error al obtener los usuarios" })
    }
});

//Se agrega un nuevo usuario
app.post('/admin/usuarios', async function (req, res) {
    try {
        const { usuario, contraseña, email, puntos_obtenidos, partidas_ganadas, es_admin } = req.body;
        
        await realizarQuery(`INSERT INTO Usuarios (usuario, contraseña, email, puntos_obtenidos, partidas_ganadas, es_admin) VALUES
            ('${usuario}', '${contraseña}', '${email}', '${puntos_obtenidos || 0}', '${partidas_ganadas || 0}', '${es_admin ? 1 : 0}')`);
        
        res.status(201).json({ mensaje: "Usuario creado con éxito" });
    } catch (error) {
        console.error("Error en POST /admin/usuarios:", error);
        
        // Si el usuario ya existe (duplicado)
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ mensaje: "Ya existe un usuario con ese nombre o email" });
        }
        
        res.status(500).json({ mensaje: "Hubo un error al crear el usuario" });
    }
});

//Elimina el usuario segun su usuario
app.delete('/admin/usuarios/:usuario', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`DELETE FROM Usuarios WHERE usuario = '${req.params.usuario}'`);
        res.json({ mensaje: "Usuario eliminado correctamente" });
    } catch (error) {
        console.error("Error en DELETE /admin/usuarios:", error);
        res.status(500).json({ mensaje: "Hubo un error al eliminar el usuario" });
    }
})

//Modifica datos del usuario
app.put('/admin/usuarios/:usuario', async function (req, res) {
    try {
        const { usuario, contraseña, email, puntos_obtenidos, partidas_ganadas, es_admin } = req.body;
        await realizarQuery(`UPDATE Usuarios SET
            usuario = '${usuario}',
            contraseña = '${contraseña}',
            email = '${email}',
            puntos_obtenidos = '${puntos_obtenidos}',
            partidas_ganadas = '${partidas_ganadas}',
            es_admin = '${es_admin ? 1 : 0}'
            WHERE usuario = '${req.params.usuario}'`);
        res.json({ mensaje: "Usuario modificado" });
    } catch (error) {
        console.error("Error en PUT /admin/usuarios:", error);
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ mensaje: "Ya existe un usuario con ese nombre" });
        }
        res.status(500).json({ mensaje: "Hubo un error al modificar el usuario" });
    }
})

///////// Puntos
app.get('/admin/puntos', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`SELECT * FROM Puntos`)
        res.status(200).json(respuesta)
    } catch (error) {
        console.error("Error en /puntos:", error)
        res.status(500).json({ mensaje: "Hubo un error al obtener los puntos" })
    }
});

//Se agregan nuevos puntos
app.post('/admin/puntos', async function (req, res) {
    const { id_partida, id_usuario, puntos_obtenidos } = req.body;
    try {
        await realizarQuery(
            `INSERT INTO Puntos (id_partida, id_usuario, puntos_obtenidos) 
             VALUES ('${id_partida}', '${id_usuario}', '${puntos_obtenidos}')`
        );
        res.status(201).json({ mensaje: "Puntos creados con éxito" });
    } catch (error) {
        console.error("Error en POST /admin/puntos:", error);
        res.status(500).json({ mensaje: "Hubo un error al crear los puntos" });
    }
});

// Eliminar puntos por ID
app.delete('/admin/puntos', async function (req, res) {
    const { id } = req.body;
    try {
        await realizarQuery(`DELETE FROM Puntos WHERE id = ${id}`);
        res.status(200).json({ mensaje: "Puntos eliminados con éxito" });
    } catch (error) {
        console.error("Error en DELETE /admin/puntos:", error);
        res.status(500).json({ mensaje: "Hubo un error al eliminar los puntos" });
    }
});

// Modificar puntos
app.put('/admin/puntos', async function (req, res) {
    const { id, id_partida, id_usuario, puntos_obtenidos } = req.body;
    try {
        await realizarQuery(
            `UPDATE Puntos 
             SET id_partida = '${id_partida}', id_usuario = '${id_usuario}', puntos_obtenidos = '${puntos_obtenidos}' 
             WHERE id = ${id}`
        );
        res.status(200).json({ mensaje: "Puntos modificados con éxito" });
    } catch (error) {
        console.error("Error en PUT /admin/puntos:", error);
        res.status(500).json({ mensaje: "Hubo un error al modificar los puntos" });
    }
});

///////// Partidas

app.get('/admin/partidas', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`SELECT * FROM Partidas`)
        res.status(200).json(respuesta)
    } catch (error) {
        console.error("Error en /partidas:", error)
        res.status(500).json({ mensaje: "Hubo un error al obtener las partidas" })
    }
});

app.post('/admin/partidas', async function (req, res) {
    try {
        const { rondas, usuario_ganador } = req.body;
        await realizarQuery(`INSERT INTO Partidas (rondas, usuario_ganador) VALUES ('${rondas}', '${usuario_ganador}')`);
        res.status(201).json({ mensaje: "Partida creada con éxito" });
    } catch (error) {
        console.error("Error en POST /admin/partidas:", error);
        res.status(500).json({ mensaje: "Hubo un error al crear la partida" });
    }
});

app.delete('/admin/partidas/:id', async function (req, res) {
    try {
        await realizarQuery(`DELETE FROM Partidas WHERE id_partidas = ${req.params.id}`);
        res.json({ mensaje: "Partida eliminada correctamente" });
    } catch (error) {
        console.error("Error en DELETE /admin/partidas:", error);
        res.status(500).json({ mensaje: "Hubo un error al eliminar la partida" });
    }
});

app.put('/admin/partidas/:id', async function (req, res) {
    try {
        const { rondas, usuario_ganador } = req.body;
        await realizarQuery(`UPDATE Partidas SET
            rondas = '${rondas}',
            usuario_ganador = '${usuario_ganador}'
            WHERE id_partidas = ${req.params.id}`);
        res.json({ mensaje: "Partida modificada correctamente" });
    } catch (error) {
        console.error("Error en PUT /admin/partidas:", error);
        res.status(500).json({ mensaje: "Hubo un error al modificar la partida" });
    }
});

///////// Palabras

app.get('/admin/palabras', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`SELECT * FROM Palabras`);
        res.status(200).json(respuesta);
    } catch (error) {
        console.error("Error en GET /admin/palabras:", error);
        res.status(500).json({ mensaje: "Hubo un error al obtener las palabras" });
    }
});

// Agregar nueva palabra
app.post('/admin/palabras', async function (req, res) {
    const { palabra, id_partida } = req.body;
    try {
        await realizarQuery(
            `INSERT INTO Palabras (palabra, id_partida) 
             VALUES ('${palabra}', '${id_partida}')`
        );
        res.status(201).json({ mensaje: "Palabra creada con éxito" });
    } catch (error) {
        console.error("Error en POST /admin/palabras:", error);
        res.status(500).json({ mensaje: "Hubo un error al crear la palabra" });
    }
});

// Eliminar palabra por ID
app.delete('/admin/palabras', async function (req, res) {
    const { id } = req.body;
    try {
        await realizarQuery(`DELETE FROM Palabras WHERE id_palabra = ${id}`);
        res.status(200).json({ mensaje: "Palabra eliminada con éxito" });
    } catch (error) {
        console.error("Error en DELETE /admin/palabras:", error);
        res.status(500).json({ mensaje: "Hubo un error al eliminar la palabra" });
    }
});

// Modificar datos de la palabra
app.put('/admin/palabras', async function (req, res) {
    const { id, palabra, id_partida } = req.body;
    try {
        await realizarQuery(
            `UPDATE Palabras 
             SET palabra = '${palabra}', id_partida = '${id_partida}' 
             WHERE id_palabra = ${id}`
        );
        res.status(200).json({ mensaje: "Palabra modificada con éxito" });
    } catch (error) {
        console.error("Error en PUT /admin/palabras:", error);
        res.status(500).json({ mensaje: "Hubo un error al modificar la palabra" });
    }
});


/// Socket

// Se inicializa el servidor de comunicación en tiempo real con Socket.IO
const io = new Server(server, { // Con "server" toma el servidor que escucha en el puerto 4000 y le otorga la capacidad del socket
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"], // Establece sus clientes
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true, // Para que el middleware reconozca a cada usuario
    },
});

// Conecta las sesiones de express y de socket para saber que usuario está conectado a través del socket
// ¿Para qué?
// Para saber, por ejemplo, quien envía un mensaje o quien gana la partida
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});


let contador = 0;
const salas = {};
io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);

    // --- UNIRSE A SALA Y GESTIONAR JUGADORES ---
    socket.on("joinRoom", ({ room, usuario }) => {
        const nombreFinal = usuario || `Jugador_${socket.id.substring(0, 4)}`;

        // Abandonar la sala anterior si estaba en alguna
        if (socket.roomActual) {
            socket.leave(socket.roomActual);
        }

        socket.join(room);
        socket.roomActual = room;
        socket.nombreUsuario = nombreFinal;

        // Crear la sala si no existe
        if (!salas[room]) {
            salas[room] = [];
        }

        // Verificar si el jugador ya estaba registrado en esta sala
        const yaExiste = salas[room].find(p => p.socketId === socket.id);
        if (!yaExiste) {
            const esElPrimero = salas[room].length === 0;

            salas[room].push({
                id: socket.id,
                socketId: socket.id,
                nombre: nombreFinal,
                puntos: 0,
                dibujando: esElPrimero, // El primer jugador (creador) empieza dibujando
                esCreador: esElPrimero  // Es el #1 / Creador
            });
        }

        // Emitir la lista actualizada de jugadores a TODOS en la sala
        io.to(room).emit("actualizar_jugadores", salas[room]);
    });

    // --- EVENTOS DEL CHAT ---
    socket.on('enviar_mensaje', (datosMensaje) => {
        if (socket.roomActual) {
            io.to(socket.roomActual).emit('recibir_mensaje', datosMensaje);
        } else {
            io.emit('recibir_mensaje', datosMensaje);
        }
    });

    // --- EVENTOS DE DIBUJO ---
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

    // --- DESCONEXIÓN DE JUGADORES ---
    socket.on("disconnect", () => {
        const room = socket.roomActual;
        if (room && salas[room]) {
            // Remover jugador de la sala
            salas[room] = salas[room].filter(p => p.socketId !== socket.id);

            // Si quedan jugadores pero se fue el creador o dibujante, reasignar al primero de la lista
            if (salas[room].length > 0) {
                if (!salas[room].some(p => p.esCreador)) {
                    salas[room][0].esCreador = true;
                }
                if (!salas[room].some(p => p.dibujando)) {
                    salas[room][0].dibujando = true;
                }
            } else {
                delete salas[room]; // Eliminar sala vacía
            }

            io.to(room).emit("actualizar_jugadores", salas[room]);
        }
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});
