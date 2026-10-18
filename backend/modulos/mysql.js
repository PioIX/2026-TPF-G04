const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'nombre_de_tu_base_de_datos'
});

connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

function realizarQuery(sql) {
  return new Promise((resolve, reject) => {
    connection.query(sql, (error, resultados) => {
      if (error) {
        reject(error);
      } else {
        resolve(resultados);
      }
    });
  });
}

module.exports = { realizarQuery };