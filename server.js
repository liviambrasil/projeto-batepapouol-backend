import express from 'express'
import cors from 'cors'
import dayjs from 'dayjs'
import { stripHtml } from "string-strip-html";
import joi from 'joi'
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path'

let participants;
let messages;

const app = express();
app.use(express.json());

var corsOptions = {
    origin: '*',
}
app.use(cors(corsOptions));


if (existsSync('participants.json')) {
    let savedParticipants = JSON.parse(readFileSync(path.resolve("participants.json")));
    participants=savedParticipants;
}
else {
    participants = [];
}
if (existsSync('messages.json')) {
    let savedMessages = JSON.parse(readFileSync(path.resolve("messages.json")));
    messages=savedMessages;
}
else {
    messages = [];
}

function saveParticipants () {
    writeFileSync('participants.json', JSON.stringify(participants))
}

function saveMessages () {
    writeFileSync('messages.json', JSON.stringify(messages))
}


function cleanData (body) {
    const objArray = Object.entries(body)       //transformar numa matriz
    const cleanArray = objArray.map(item => {   //percorrer a matriz com map 
        const [key, value] = item               //destructuring da array
        return [key, stripHtml(value).result.trim()]   //limpar a array criada executando stripHtml pra cada value do objeto inicial removendo os espaços em seguida
    })
    return Object.fromEntries(cleanArray)       //transforma a matriz em objeto de novo
}

app.post('/participants', (req,res) => {

    const schema = joi.object({
        name: joi.string().required()
    });
    const isValid = schema.validate(req.body);

    if(isValid.error) return res.sendStatus(422);
    
    const participant = cleanData(req.body);
    console.log(participant)

    if(!participants.some(({name}) => name === participant.name)) {
        participants.push({name: participant.name, lastStatus: Date.now()})
        messages.push({from: participant.name, to: 'Todos', text: 'entra na sala', type: 'status', time: dayjs().format('HH:mm:ss')})
        saveParticipants()
        saveMessages()
        return res.sendStatus(200)
    }
    res.sendStatus(400)
})

app.get('/participants', (req,res) => {
    res.send(participants)
})

app.post('/messages', (req,res) => {

    const schema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().valid("message", "private_message").required()
    })

    const isValid = schema.validate(req.body);

    if(isValid.error) return res.sendStatus(422);

    const message = cleanData(req.body)
    const {to, text, type} = message
    const from = req.header("User")

    if(participants.find(({name}) => name === from)) {
        messages.push({...message, from, time: dayjs().format('HH:mm:ss')})
        saveMessages()
        return res.sendStatus(200)
    }

    res.sendStatus(400)
})

app.get('/messages', (req,res) => {
    const limit = req.query.limit
    const user = req.header("User")

    const messagesFiltered = messages.filter(element => element.type === "message" || element.type === "status" || element.to === user || element.from === user);

    limit
    ? res.send(messages.slice(0, limit))
    : res.send(messages)
})

app.post('/status', (req,res) => {
    const user = req.header("User")

    const participant = participants.find(({name}) => name === user)

        participant
        ? ((participant.lastStatus = Date.now()) && res.sendStatus(200))
        : res.sendStatus(400)

    saveParticipants()
})

setInterval(() => {
    participants = participants.filter(element => {
        if ((Date.now() - element.lastStatus) < 10000) {
            return true
        }
        else {
            messages.push({from: element.name, to: 'Todos', text: 'sai da sala...', type: 'status', time: dayjs().format('HH:mm:ss')})
            return false
        }    
    })
    saveParticipants()
    saveMessages()
}, 15000)

app.listen(4000)