const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyparser = require('body-parser');
const swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');

const serviceAccount = require('./serviceAccountKey.json');
const admin = require('firebase-admin');
const { domainToASCII } = require('url');
const app = express();
const router = express.Router();

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJoZWxsbyI6IndvcmxkISIsIm51bWJlciI6MC41MzgyNzE0MTk3Nzg5NDc4LCJpYXQiOjE1NDIxMDQ0NDgsImV4cCI6MTU0MjEwNDUwOCwiaXNzIjoiZnVuLXdpdGgtand0cyIsInN1YiI6IkF6dXJlRGlhbW9uZCJ9.LRVmeIzAYk5WbDoKfSTYwPx5iW0omuB76Qud-xR8We4'
const BEARER = 'Bearer ' + TOKEN

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://authentication-5e20d.firebaseio.com'
});

let db = admin.firestore();
const collection = db.collection('usuarios');

app.listen(process.env.PORT || 3000, () => {
    console.log('Server Started')
});

app.use(cors());

app.use(bodyparser.json());

router.post('/login', (req, res) => {
    collection.where('email', '==', req.body.email).where('senha', '==', req.body.senha).get().then(a => {
        if (a.empty) {
            res.status(401).send({
                message: 'Login inválido'
            })
        } else {
            res.json({
                token: TOKEN
            })
        }
    });
});

router.post('/cadastro', (req, res) => {
    if (!req.body.email || !req.body.nome || !req.body.senha) {
        res.status(400).send({
            message: 'Campos inválidos'
        })
    } else if (req.body.senha && req.body.senha.length < 8) {
        res.status(400).send({
            message: 'A senha deve possuir no mínimo 8 digitos'
        })
    } else {
        collection.where('email', '==', req.body.email).get().then(a => {
            if (!a.empty) {
                res.status(400).send({
                    message: 'Este email já está cadastrado na base de dados'
                })
            } else {
                collection.doc().set(req.body).then(() => {
                    res.json({
                        message: 'Usuário criado com sucesso'
                    })
                })
            }
        });
    }
});

router.get('/tabela', (req, res) => {
    if (!req.headers.authorization || req.headers.authorization !== BEARER) {
        res.status(401).json({
            message: 'Usuário não logado ou token inválido'
        })
    }
    const rows = []
    let cols = [];
    while (cols.length < 2) {
        cols = Object.keys(TIPO_ROW).filter(k => getRandomBoolean());
    }
    for (let i = 0; i < getRandomNumberWithRange(1, 13); i++) {
        let row = {};
        cols.forEach(c => {
            if (c === "usuário") {
                row[c] = 'usuário ' + i;
            } else {
                row[c] = getRandomNumberWithRange(0, 101);
            }
        })
        rows.push(row);
    }
    res.json(rows);
});

router.get('/formulario', (req, res) => {
    if (!req.headers.authorization || req.headers.authorization !== BEARER) {
        res.status(401).json({
            message: 'Usuário não logado ou token inválido'
        })
    }
    res.json(montaFormularioRandomico());
});

router.post('/formulario', (req, res) => {
    if (!req.headers.authorization || req.headers.authorization !== BEARER) {
        res.status(401).json({
            message: 'Usuário não logado ou token inválido'
        })
    }
    const campos = req.body;
    if (!campos || !campos.length) {
        validationError(res);
        return;
    }
    campos.forEach(c => {
        if(!c.id || !c.valor || !c.tipo) {
            validationError(res);
            return;
        }
        switch(c.tipo) {
            case TIPO_FORM.NUMERICO: {
                if (typeof c.valor !== 'number') {
                    validationError(res);
                    return;
                }
                break;
            }
            case TIPO_FORM.SELECAO: {
                if (typeof c.valor !== 'string' || !c.valor.includes('Opcao')) {
                    validationError(res);
                    return;
                }
                break;
            }
            case TIPO_FORM.TEXTO: {
                if (typeof c.valor !== 'string') {
                    validationError(res);
                    return;
                }
                break;
            }
            default: {
                validationError(res);
                return;
            }
        }
    });
    res.json({
        message: 'Formulário validado com sucesso'
    })
});

const validationError = (res) => {
    res.status(400).json({
        message: 'Os dados são inválidos'
    });
}

router.get('/arquivo/:name', (req, res) => {
    const fileName = req.params['name'] + '.pdf'
    var data
    try {
        data = fs.readFileSync(path.join(__dirname, fileName));
    } catch (error) {
        res.status(400).json(error);
        return;
    }
    res.contentType("application/pdf");
    res.send(data);
});

app.use('/api/v1', router);

app.get('/**', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

function montaFormularioRandomico() {
    const formulario = []
    for (let i = 0; i < getRandomNumberWithRange(2, 9); i++) {
        const campo = {...TIPO_CAMPO};
        campo.id = i + 1;
        campo.tipo = getRandomFormType();
        campo.titulo = `Campo ${i+1}, tipo ${campo.tipo}`
        if (campo.tipo === TIPO_FORM.SELECAO) {
            campo.opcoes = montaOpcoesSelecao();
            campo.valor = campo.opcoes[getRandomNumberWithRange(0, campo.opcoes.length - 1)];
        } else if (campo.tipo === TIPO_FORM.ARQUIVO) {
            campo.valor = `pdf${getRandomNumberWithRange(1,3)}`
        } else {
            campo.valor = campo.tipo === TIPO_FORM.NUMERICO ? 100 : '';
        }
        formulario.push(campo)
    }
    return formulario;
}

function getRandomFormType() {
    switch(getRandomNumberWithRange(0, 4)) {
        case 0: return TIPO_FORM.NUMERICO;
        case 1: return TIPO_FORM.SELECAO;
        case 2: return TIPO_FORM.TEXTO;
        default: return TIPO_FORM.TEXTO;
    }
}

function montaOpcoesSelecao() {
    const opcoes = [];
    opcoes.push('Opcao 1');
    opcoes.push('Opcao 2');
    const times = getRandomNumberWithRange(0, 6);
    for (let i = 0; i < times; i++) {
        opcoes.push(`Opcao ${i + 3}`);
    }
    return opcoes
}

function getRandomNumberWithRange(min, max) {
    return Math.floor(Math.random() * (+max - +min)) + +min;
}

function getRandomBoolean() {
    return !!getRandomNumberWithRange(0, 2);
}

const TIPO_FORM = {
    NUMERICO: 'NUMERICO',
    TEXTO: 'TEXTO',
    SELECAO: 'SELECAO',
    ARQUIVO: 'ARQUIVO',
}


const TIPO_CAMPO = {
    id: null,
    titulo: null,
    tipo: null,
    valor: null,
    opcoes: null
}

const TIPO_ROW = {
    "usuário": null,
    "paramêtro": null,
    "tipoLinha": null,
    "transmissão": null,
    "sequenciaEnergética": null,
    "produtividade": null,
    "lucratividade": null,
    "liquidez": null,
    "crescimento": null,
    "rendimento": null,
}
