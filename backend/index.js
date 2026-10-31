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
    try {
        await realizarQuery(`INSERT INTO Puntos (id_partida, id_usuario, puntos_obtenidos) VALUES
            ('${req.body.id_partida}', '${req.body.id_usuario}', '${req.body.puntos_obtenidos}')`);
        res.status(201).json({ mensaje: "Puntos creado con éxito" });
    } catch (error) {
        console.error("Error en /puntos:", error);
        res.status(500).json({ mensaje: "Hubo un error al crear los puntos" });
    }
});

//Elimina puntos
app.delete('/admin/puntos', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`DELETE FROM Puntos WHERE id = ${req.body.id}`)
        res.json({ message: "Puntos eliminados" })
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Hubo un error" });
    }
})

//Modifica datos de los puntos
app.put('/admin/puntos', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`UPDATE Puntos SET ${req.body.modificacion} = '${req.body.valor}' WHERE id = ${req.body.id}`)
        res.json({ message: "Puntos modificados" })
    } catch (error) {
        return ("Hubo un error")
    }
})

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
        let respuesta = await realizarQuery(`SELECT * FROM Palabras`)
        res.status(200).json(respuesta)
    } catch (error) {
        console.error("Error en /palabras:", error)
        res.status(500).json({ mensaje: "Hubo un error al obtener las palabras" })
    }
});

app.post('/admin/palabras', async function (req, res) {
    try {
        await realizarQuery(`INSERT INTO Palabras (palabra, id_partida) VALUES
            ('${req.body.palabra}', '${req.body.id_partida}')`);
        res.status(201).json({ mensaje: "Palabra creada con éxito" });
    } catch (error) {
        console.error("Error en /palabras:", error);
        res.status(500).json({ mensaje: "Hubo un error al crear la palabra" });
    }
});

app.delete('/admin/palabras', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`DELETE FROM Palabras WHERE id = ${req.body.id}`)
        res.json({ message: "palabra eliminada" })
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Hubo un error" });
    }
})

app.put('/admin/palabras', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`UPDATE Palabras SET ${req.body.modificacion} = '${req.body.valor}' WHERE id = ${req.body.id}`)
        res.json({ message: "palabra modificada" })
    } catch (error) {
        return ("Hubo un error")
    }
})


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

io.on("connection", (socket) => {
    const req = socket.request;

    socket.on("joinRoom", (data) => {

        if (req.session.room != undefined && req.session.room.length > 0) {
            socket.leave(req.session.room);
        }

        req.session.room = data.room;
        req.session.save();

        req.session.room = data.room;
        socket.join(req.session.room);

        io.to(req.session.room).emit("chat-messages", {
            user: req.session.user,
            room: req.session.room,
        });
    });

    socket.on("pingAll", (data) => {
        console.log("PING ALL:", data);
        io.emit("pingAll", { event: "Ping to all", message: data });
    });

    socket.on("sendMessage", (data) => {
        io.to(req.session.room).emit("newMessage", {
            room: req.session.room,
            message: data.message,
        });
    });

    socket.on("eventoPersonalizado", () => {
        contador++;
        socket.emit("respuestaPersonalizada", { contador });
    });

    socket.on("disconnect", () => {
        console.log("Disconnect");
    });
});
