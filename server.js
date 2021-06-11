import express from 'express'
import cors from 'cors'
import dayjs from 'dayjs'

let participants = []; //{name: , lastStatus: }
let messages = [];

const app = express();
app.use(express.json());

var corsOptions = {
    origin: '*',
}
app.use(cors(corsOptions));

app.post('/participants', (req,res) => {
    const participant = req.body.name;
    console.log(participant)

    if(participant && !participants.some(({name}) => name === participant)) {
        participants.push({name: participant, lastStatus: Date.now()})
        messages.push({from: participant, to: 'Todos', text: 'entra na sala', type: 'status', time: dayjs().format('HH:mm:ss')})

        return res.sendStatus(200)
    }
    res.sendStatus(400)
})

app.get('/participants', (req,res) => {
    res.send(participants)
})

app.listen(4000)