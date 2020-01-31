const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bodyparser = require('body-parser');
const swaggerUi = require('swagger-ui-express'),
    swaggerDocument = require('./swagger.json');

const app = express();
const router = express.Router();

app.listen(process.env.PORT || 3000, () => {
    console.log('Server Started')
});

app.use(cors());

app.use(bodyparser.json());

router.get('/tabela', (req, res) => {
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
    res.json(montaFormularioRandomico());
});

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
        campo.tipo = getRandomFormType();
        if (campo.tipo === TIPO_FORM.SELECAO) {
            campo.opcoes = montaOpcoesSelecao();
            campo.valor = campo.opcoes[getRandomNumberWithRange(0, campo.opcoes.length - 1)];
        } else if (campo.tipo === TIPO_FORM.ARQUIVO) {
            campo.valor = `/arquivo/pdf${getRandomNumberWithRange(1,3)}`
        } else {
            campo.valor = campo.tipo === TIPO_FORM.NUMERICO ? 0 : '';
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
        default: return TIPO_FORM.ARQUIVO;
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
    tipo: null,
    valor: null,
    opcoes: null
}

const TIPO_ROW = {
    "usuário": null,
    "paramêtro": null,
    "tipo linha": null,
    transmissão: null,
    "sequencia energética": null,
    produtividade: null,
    lucratividade: null,
    liquidez: null,
    crescimento: null,
    rendimento: null,
}
