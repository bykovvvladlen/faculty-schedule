const express = require('express');
const mysql = require('mysql2');
const router = express.Router();

function connectToDatabase() {
    return mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'bykov',
        password: 'ZChw9ohQCoMJ',
    });
}

const connection = connectToDatabase();

function create(table, values) {
    return new Promise(function(resolve, reject) {
        const fields = Object.keys(values);
        values = Object.values(values);
        const query = `INSERT INTO \`${table}\` (${fields.join()}) VALUES (${values.map(i => '?').join()})`;
        connection.execute(
            query,
            [...values],
            function(error, results) {
                if (error) {
                    reject(error);
                }

                else {
                    resolve(results);
                }
            }
        );
    });
}

function read(table, id) {
    return new Promise(function(resolve, reject) {
        const query = id ? `SELECT * FROM \`${table}\` WHERE id = ${id}` : `SELECT * FROM \`${table}\``;
        connection.execute(
            query,
            function(error, results) {
                if (error) {
                    reject(error);
                }

                else {
                    resolve(results);
                }
            }
        );
    });
}

function update(table, id, data) {
    return new Promise(function(resolve, reject) {
        const fields = Object.keys(data).filter(key => data[key]);
        const set = fields.map(key => `${key} = '${data[key]}'`).join();
        const query = `UPDATE \`${table}\` SET ${set} WHERE id = ?`;
        connection.execute(
            query,
            [id],
            function(error, results) {
                if (error) {
                    reject(error);
                }

                else {
                    resolve(results);
                }
            }
        );
    });
}

function deleteRow(table, id) {
    return new Promise(function(resolve, reject) {
        connection.execute(
            `DELETE FROM \`${table}\` WHERE id=?`,
            [id],
            function(error, results) {
                if (error) {
                    reject(error);
                }

                else {
                    resolve(results);
                }
            }
        );
    });
}

router.post('/auth', async function(req, res) {

});

function generateToken(length = 36) {
    let result = '';
    const symbols = [...'QWERTYUIOPASDFGHJKLZXCVBNM0123456789qwertyuiopasdfghjklzxcvbnm'];
    for (let i = 0; i < length; i++) {
        result += symbols[Math.floor(Math.random() * symbols.length)];
    }

    return result;
}

router.post('/login', async function(req, res) {
    const { login, password } = req.body;
    if (login && password) {
        connection.execute(
            'SELECT 1 FROM `users` WHERE login=? AND password=?',
            [login, password],
            function(error, results) {
                if (error || results.length === 0) {
                    res.json({ success: false, error: error ? error : 'Пользователя с такими данными не существует.' });
                }

                else {
                    const token = generateToken();
                    connection.execute(
                        'UPDATE `users` SET token=? WHERE login=?',
                        [token, login],
                        function(error) {
                            if (error) {
                                res.json({ success: false, error });
                            }

                            else {
                                res.cookie('token', token, { maxAge: 86400 * 1000 }).json({ success: true });
                            }
                        }
                    );
                }
            }
        )
    }

    else {
        res.json({ success: false, error: 'Логин или пароль не указаны.' });
    }
});

router.post('/signup', async function(req, res) {
    const { login, password } = req.body;
    if (login && password) {
        connection.execute(
            'SELECT 1 FROM `users` WHERE login=?',
            [login],
            function(error, results) {
                if (error || results.length > 0) {
                    res.json({ success: false, error: error ? error : 'Пользователь с таким логином уже существует.' });
                }

                else {
                    const token = generateToken();
                    connection.execute(
                        'INSERT INTO `users` (token, login, password) VALUES (?, ?, ?)',
                        [token, login, password],
                        function(error) {
                            if (error) {
                                res.json({ success: false, error });
                            }

                            else {
                                res.cookie('token', token, { maxAge: 86400 * 1000 }).json({ success: true });
                            }
                        }
                    );
                }
            }
        )
    }

    else {
        res.json({ success: false, error: 'Логин или пароль не указаны.' });
    }
});

router.all('/', async function(req, res) {
    const { method, query, body } = req;
    const { table, id } = query;

    switch(method) {
        case 'GET':
            await read(table, id)
                .then(results => res.json({ success: true, results }))
                .catch(error => res.json({ success: false, error }));
            break;
        case 'POST':
            await update(table, id, body)
                .then(results => res.json({ success: true, results }))
                .catch(error => res.json({ success: false, error }));
            break;
        case 'PUT':
            await create(table, body)
                .then(results => res.json({ success: true, results }))
                .catch(error => res.json({ success: false, error }));
            break;
        case 'DELETE':
            await deleteRow(table, id)
                .then(results => res.json({ success: true, results }))
                .catch(error => res.json({ success: false, error }));
            break;
    }
});

module.exports = router;