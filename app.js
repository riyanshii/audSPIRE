'use strict';


const express = require('express')
const app = express()
const path = require('path')
const ejs = require('ejs');
const bodyParser = require('body-parser')
const nodemailer = require("nodemailer");
const fs = require("fs");
const dotenv = require('dotenv');
const hostname = 'localhost';
const cors = require('cors');

let eventList;
fs.readFile('./eventList.json', 'utf8' , (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    eventList = JSON.parse(data)
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, './about-contact')));
app.use(express.static(path.join(__dirname, "./public")))
app.use(express.static(path.join(__dirname, "./registerforms")))
app.use(express.static(path.join(__dirname, "./sponsors")))
app.use(express.static(path.join(__dirname, "./college")))
app.use(express.static(path.join(__dirname, "./joinus")))

app.set("views", [path.join(__dirname, './templates/views'), path.join(__dirname, './registerforms/form1'),  path.join(__dirname, './registerforms/form2')]);
app.set("view engine", "ejs");
dotenv.config({path:"./config.env"});

let port = (process.env.PORT || 3000)

//////////////////////////////////////////////////
var firebase = require("firebase/app");
var firestore = require("firebase/firestore");

var firebaseConfig = {
    apiKey: process.env.DB_APIKEYS,
    authDomain: process.env.DB_AUTH,
    projectId: process.env.DB_PROID,
    storageBucket: process.env.DB_BUCKET,
    messagingSenderId: process.env.DB_SENDERID,
    appId: process.env.DB_APPID,
    measurementId: process.env.DB_MEASUREID
  };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });
/////////////////////////////////////////////////////////

app.get('/', (req, res) => {
    res.render("index");
});


app.get('/sponsors', (req, res) => {
    res.sendFile(path.join(__dirname, "./sponsors/sponsors.html"))
})
app.get('/college', (req, res) => {
    res.sendFile(path.join(__dirname, "./college/college.html"))
})

app.get('/event/:name', (req, res) => {

    const Event = eventList.filter((event) => { return event.sname === req.params.name });
    res.render('event', {
        sname :Event[0].sname,
        name: Event[0].name,
        text: Event[0].text,
        date:Event[0].date,
        imgsrc: Event[0].imgsrc,
        reglink: Event[0].reglink + req.params.name,
        prizes : Event[0].prizes
    })
})



app.get('/register/:name', (req, res) => {
    
    if(req.params.name === "doubtdwell")
    {
        res.render('reg2', {
            name: req.params.name
        })
    }

    else{
        res.render('reg1', {
            name: req.params.name
        })
    }
    
})

app.post('/registered/:name', async(req, res) => {

    let data;

    if(req.params.name === "doubtdwell")
    {
        data = {
            fname: req.body.fname,
            lname: req.body.lname,
            clg: req.body.clg,
            wp: req.body.wp,
            year: req.body.year,
            email: req.body.email,
            topic:req.body.topic,
            favour:req.body.favour
        }
    }

    else {
        data = {
            fname: req.body.fname,
            lname: req.body.lname,
            clg: req.body.clg,
            wp: req.body.wp,
            year: req.body.year,
            email: req.body.email
        }
    }
    
    const evname = req.params.name;
    const result = await db.collection(evname).add(data);

    if (result) {
        res.redirect("/registered");
    } else {
        //console.log("error");
    }
})

app.get("/registered", (req, res) => {
    res.sendFile(path.join(__dirname, './public/registered/main.html'));
})


app.get("/aboutus", (req, res) => {
    res.sendFile(path.join(__dirname, './about-contact/about-us.html'));
})

app.get("/contactus", (req, res) => {
    res.sendFile(path.join(__dirname, './about-contact/contact-us.html'));

})




app.post("/contacted", async(req, res) => {

    // let testAccount = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.USER,
            pass: process.env.PASS,
        }
    });

    let mailHTMl = `<p>${req.body.message}</p>
    <br>
                    <h2>Contact Number : ${req.body.phone}</h2>`

    let mailOptions = {
        from: "feedbackaudspirebusiness@gmail.com",
        to: "audspirebusiness@gmail.com",
        subject: req.body.name + " contacted you..",
        html: mailHTMl,
    }


    transporter.sendMail(mailOptions, (error, info) => {
        if (error)
            return console.log(error)

        res.redirect('/');
        alert('Thanks for contacting..');
    });


})


app.get("/joinus", (req, res) => {
    res.sendFile(path.join(__dirname, './joinus/join.html'));
})

app.get("/joinus/form", (req, res) => {
    res.sendFile(path.join(__dirname, './joinus/form.html'));
})

app.post("/joinus/form", async (req, res) => {
    
    let submitDate = new Date();

    let data = {
        fname: req.body.fname,
        lname: req.body.lname,
        clg: req.body.clg,
        wp: req.body.wp,
        year: req.body.year,
        email: req.body.email,
        work:req.body.work,
        resume:req.body.resume,
        submitDate: submitDate,
    }

    const result = await db.collection('join-us').add(data);

    if (result) {
        res.redirect("/registered");
    } else {
        //console.log("error");
    }
})

app.listen(port, hostname,() => {
    // console.log("server running..");
    console.log(`Server running at http://${hostname}:${port}/`);

})