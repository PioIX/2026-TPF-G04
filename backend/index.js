// require('dotenv').config({ path: __dirname + '/.pio.env' })   
// require('dotenv').config({ path: __dirname + '/.home.env' })

var express = require('express'); //Tipo de servidor: Express
var bodyParser = require('body-parser'); //Convierte los JSON
var cors = require('cors');
const { realizarQuery } = require('./modulos/mysql');

var app = express(); //Inicializo express
var port = process.env.PORT || 4000; //Ejecuto el servidor en el puerto 4000

// Convierte una petición recibida (POST-GET...) a objeto JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

//Pongo el servidor a escuchar
app.listen(port, function () {
    console.log(`Server running in http://localhost:${port}`);
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
app.delete('/usuarios', async function(req,res){
    try{
        let respuesta = await realizarQuery(`DELETE FROM Usuarios WHERE id = ${req.body.id}`)
        res.json({ message: "Usuario eliminado" })
    }catch(error){
        return ("Hubo un error")
    }
})

//Modifica datos del usuario
app.put('/usuarios', async function(req,res){
    try{
        let respuesta = await realizarQuery(`UPDATE Usuarios SET ${req.body.modificacion} = '${req.body.valor}' WHERE id = ${req.body.id}`)
        res.json({ message: "Usuario modificado" })
    }catch(error){
        return("Hubo un error")
    }
})

///////// Puntos
app.get('/puntos', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`SELECT * FROM Puntos`)
        res.status(200).json(respuesta)
    } catch (error) {
        console.error("Error en /puntos:", error)
        res.status(500).json({ mensaje: "Hubo un error al obtener los puntos" })
    }
});

//Se agregan nuevos puntos
app.post('/puntos', async function (req, res) {
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
app.delete('/puntos', async function(req,res){
    try{
        let respuesta = await realizarQuery(`DELETE FROM Puntos WHERE id = ${req.body.id}`)
        res.json({ message: "Puntos eliminados" })
    }catch(error){
        return ("Hubo un error")
    }
})

//Modifica datos de los puntos
app.put('/puntos', async function(req,res){
    try{
        let respuesta = await realizarQuery(`UPDATE Puntos SET ${req.body.modificacion} = '${req.body.valor}' WHERE id = ${req.body.id}`)
        res.json({ message: "Puntos modificados" })
    }catch(error){
        return("Hubo un error")
    }
})

///////// Partidas

app.get('/partidas', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`SELECT * FROM Partidas`)
        res.status(200).json(respuesta)
    } catch (error) {
        console.error("Error en /partidas:", error)
        res.status(500).json({ mensaje: "Hubo un error al obtener las partidas" })
    }
});

app.post('/partidas', async function (req, res) {
    try {
        await realizarQuery(`INSERT INTO Puntos (rondas, usuario_ganador) VALUES
            ('${req.body.rondas}', '${req.body.usuario_ganador}')`);
        res.status(201).json({ mensaje: "Partida creada con éxito" });
    } catch (error) {
        console.error("Error en /puntos:", error);
        res.status(500).json({ mensaje: "Hubo un error al crear la partida" });
    }
});

app.delete('/partidas', async function(req,res){
    try{
        let respuesta = await realizarQuery(`DELETE FROM Partidas WHERE id = ${req.body.id}`)
        res.json({ message: "Partida eliminada" })
    }catch(error){
        return ("Hubo un error")
    }
})

app.put('/partidas', async function(req,res){
    try{
        let respuesta = await realizarQuery(`UPDATE Partidas SET ${req.body.modificacion} = '${req.body.valor}' WHERE id = ${req.body.id}`)
        res.json({ message: "Partida modificada" })
    }catch(error){
        return("Hubo un error")
    }
})

///////// Palabras

app.get('/palabras', async function (req, res) {
    try {
        let respuesta = await realizarQuery(`SELECT * FROM Palabras`)
        res.status(200).json(respuesta)
    } catch (error) {
        console.error("Error en /palabras:", error)
        res.status(500).json({ mensaje: "Hubo un error al obtener las palabras" })
    }
});

app.post('/palabras', async function (req, res) {
    try {
        await realizarQuery(`INSERT INTO Palabras (palabra, id_partida) VALUES
            ('${req.body.palabra}', '${req.body.id_partida}')`);
        res.status(201).json({ mensaje: "Palabra creada con éxito" });
    } catch (error) {
        console.error("Error en /palabras:", error);
        res.status(500).json({ mensaje: "Hubo un error al crear la palabra" });
    }
});

app.delete('/palabras', async function(req,res){
    try{
        let respuesta = await realizarQuery(`DELETE FROM Palabras WHERE id = ${req.body.id}`)
        res.json({ message: "palabra eliminada" })
    }catch(error){
        return ("Hubo un error")
    }
})

app.put('/palabras', async function(req,res){
    try{
        let respuesta = await realizarQuery(`UPDATE Palabras SET ${req.body.modificacion} = '${req.body.valor}' WHERE id = ${req.body.id}`)
        res.json({ message: "palabra modificada" })
    }catch(error){
        return("Hubo un error")
    }
})