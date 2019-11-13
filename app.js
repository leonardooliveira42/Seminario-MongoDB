const express = require('express')
const mongoose = require('mongoose');
const clientes = require('./data/clientes.json'); 
const app = express()
const port = 3000; 
var db; // Variavel global 

// Esquema para inserção de documentos clientes 
var clientSchema = new mongoose.Schema({
    _id: Number,
    nome: String,  
    data_nascimento: Date, 
    sexo: String, 
    idade: Number, 
    location: Object
}); 
var client = new mongoose.model("cliente", clientSchema);
// Esquema para consulta de pizzas 
var pizzaSchema = new mongoose.Schema({
    _id: Number, 
    name: String, 
    tempo_preparo: Number, 
    chefe: Array || String, 
    preco: Number, 
    ingredientes: Array
}); 
var pizza = new mongoose.model("pizza", pizzaSchema); 
// Esquema para inserção de pedidos 
var requestSchema = new mongoose.Schema({
    pizza_id: Number, 
    cliente_CPF: Number, 
    nome_cliente: String, 
    local_entrega: Object, 
    data_pedido: Date, 
    adicionais: Array, 
    cliente_nota: String, 
    tempo_entrega: Number
});
var pedidoModel = new mongoose.model('pedido', requestSchema); 

// Executa quando inicia o server
app.listen(port, () => {
    // Realizando a conexão com o banco 
    db = mongoose.connection;
    mongoose.connect('mongodb://localhost:27017/pizzaria', {useNewUrlParser: true});
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', async function() {
        console.log(" >>>>>>>>>>>>>> Conectado ao MongoDB <<<<<<<<<<<<<!"); 
    });
    console.log(`--- Servidor disponivel na porta:  ${port}! --- `)
})

// Root page
app.get('/', (req, res) => {
    // Mensagem para indicar que o server ta rodando!!
    var responseMessage = ' <h1> Servidor rodando! </h1> <p> Acesse <strong> menu </strong>, <strong> clientes </strong> ou <strong> pedidos </strong></p>'
    res.send('<html><body> ' + responseMessage + '</body></html>');
})

// Lista das pizzas 
app.get('/menu', async (req, res) => {
    /**
     *  CASO HOUVESSE ALGUM CRITÉRIO DE BUSCA, ELE SERIA INSERIDO NOS PARAMETROS 
     *  DO FIND() ABAIXO.
     */
    // As pizzas foram inseridas anteriormente (durante a apresentação), elas não são inseridas por essa aplicação 
    var pizzas = await pizza.find(); // Busca no banco de dados 
    res.send(JSON.stringify(pizzas, null, 1)); // Envia para o browser 
});

// Inserindo os clientes 
app.get('/clientes', (req, res) => {
    console.log("inserindo os clientes"); 
    // Pega o vetor de clientes lidos pelo json, e gera a localização aleatoriamnete na cidade de bauru
    var clientsWithPlaces = clientes.map((client) => {
        return {
            nome: client.nome, 
            _id: client._id, 
            data_nascimento: client.data_nascimento , 
            sexo: client.sexo, 
            idade: client.idade, 
            location: {
                type: "Point",
                coordinates: [getRandomInRange( -49.123520,-49.004044,5), getRandomInRange(-22.365288,-22.279538,5)]
          }
        };
    });
    // Inserindo o vetor de clientes com a localização gerada
    client.insertMany(clientsWithPlaces, function(err) {
        var responseMessage;
         if(err) {
             responseMessage = '<h1> Erro ao inserir clientes! ' + err.errmsg + ' </h1>'; 
             //console.log(err);
        }
         else {
            responseMessage = '<h1> Clientes inseridos com sucesso!! </h1>'; 
        } 
        res.send('<html><body> ' + responseMessage + '</body></html>');
     });     
});

// Gerando os pedidos e inserindo eles 
app.get('/pedidos', async (req, res) => {
    // Lê as pizzas
    var listaPizzas = await pizza.find(); 
    // Lê os clientes 
    var listaClientes = await client.find(); 

    var sizePizzas = listaPizzas.length; 
    var sizelistaClientes = listaClientes.length; 

    var pedidos = []; 
    // A lista de possiveis adicionais 
    var ingredientesAdicionais = ["queijo", "bacon", "cebola", "tomate", "ketchup", "catupiry", 
    "chocolate", "alho", "brocolis", "palmito", "requeijão", "batata palha"]; 

    for(let i=0; i<200; i++) {
        var vetorAdicionais = []; 
        for(let j=0; j<3; j++)
            vetorAdicionais.push(ingredientesAdicionais[getRandomInt(0,ingredientesAdicionais.length)]);

        var cliente = listaClientes[getRandomInt(0,sizelistaClientes)];

        // Gera os campos aleatorios do cliente
        var pedido = {
            pizza_id: getRandomInt(0,sizePizzas),
            nome_cliente: cliente.nome, 
            cliente_CPF: cliente._id, 
            local_entrega: cliente.location,
            data_pedido: randomDate(new Date(2019, 10, 1), new Date(2019,11,10)),
            adicionais: vetorAdicionais, 
            cliente_nota: (i%7 == 0) ? "Uma nota que o cliente deixou" : '', 
            tempo_entrega: getRandomInt(1200, 7200)
        }; 
        // Insere o pedido no vetor de pedidos
        pedidos.push(pedido); 
    }

    // Insere o vetor de pedidos no bd 
    await pedidoModel.insertMany(pedidos, function(err) {
        var responseMessage;
        if (err) {
            responseMessage = '<h1> Erro ao inserir os pedidos! ' + err.errmsg + '</h1> '; 
        }
        else {
           responseMessage = '<h1> Pedidos gerados e inseridos com sucesso! </h1>'; 
        }
        res.send('<html><body> ' + responseMessage + '</body></html>');
    });


});


// Funções para gerar os dados aleatórios 
function getRandomInRange(from, to, fixed) {
    return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
    // .toFixed() returns string, so ' * 1' is a trick to convert to number
}
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}