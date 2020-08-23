const express = require("express");
const app = express();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var cors = require('cors');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var fs = require("fs");
var reserva_theme = fs.readFileSync("mail_template/reserva.html", { encoding: 'utf8' });

var helpers = require('./helpers');

var nodemailer = require("nodemailer");
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
var ses = new AWS.SES({ "Version": "2012-10-17", "Statement": [{ "Effect": "Allow", "Action": ["ses:SendEmail", "ses:SendRawEmail"], "Resource": "arn:aws:iam::406019176861:user/ses-smtp-user.20190116-210346" }]});

app.listen(helpers.getPort(), () => {
    console.log("El servidor está inicializado en el puerto "+helpers.getPort());
});

app.get('/', urlencodedParser, function(req, res){
	res.setHeader('Content-Type', 'application/json');
    res.end("OK");
});

app.get('/video', function(req, res){

	const path = '/var/nodejs/videos/'+req.query.video;
	const stat = fs.statSync(path);
	const fileSize = stat.size;
	const range = req.headers.range;
	
	if(range){

		const parts = range.replace(/bytes=/, "").split("-");
		const start = parseInt(parts[0], 10);
		const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
		const chunksize = (end-start) + 1;
		const file = fs.createReadStream(path, {start, end});
		const head = {
			'Content-Range': `bytes ${start}-${end}/${fileSize}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': chunksize,
			'Content-Type': 'video/mp4',
		}
		res.writeHead(206, head);
		file.pipe(res);

	}else{

		const head = {
			'Content-Length': fileSize,
			'Content-Type': 'video/mp4',
		}
		res.writeHead(200, head);
		fs.createReadStream(path).pipe(res);

	}

});
app.post('/mail_contacto_medici', urlencodedParser, function(req, res){

    res.setHeader('Content-Type', 'application/json');

	var mailOptions = {
		from: 'misitiodelivery@gmail.com',
		to: 'diego.gomez.bezmalinovic@gmail.com',
		subject: 'CONTACTO SITIO WEB',
		body: '<b>Nombre:</b> '+req.body.nombre+'<br/><b>Correo:</b>'+req.body.correo+'<br/><b>Asunto:</b> '+req.body.asunto+'<br/><b>Mensaje:</b> '+req.body.mensaje+'<br/>'
	};
	var params = { 
		Destination: { 
			ToAddresses: []
		}, 
		Message: { 
			Body: { 
				Html: { 
					Charset: 'UTF-8', Data: '' 
				} 
			}, 
			Subject: { 
				Charset: 'UTF-8', Data: '' 
			}
		}, 
		ReturnPath: 'misitiodelivery@gmail.com', 
		Source: 'misitiodelivery@gmail.com'
	};

	params.Destination.ToAddresses.push(mailOptions.to);
	params.Message.Subject.Data = mailOptions.subject;
	params.Message.Body.Html.Data = mailOptions.body;

	ses.sendEmail(params, (err, data) => { 
		if(!err){ 
			res.end(JSON.stringify({ op: 1 }));
		}else{
			res.end(JSON.stringify({ op: 2 }));
		}
    });

});
app.post('/mail_reserva_medici', urlencodedParser, function(req, res){

	res.setHeader('Content-Type', 'application/json');

	var mailOptions2 = {
		from: 'misitiodelivery@gmail.com',
		to: req.body.correo_doc,
		subject: 'NUEVA RESERVA WEB',
		body: '<b>Rut:</b> '+req.body.rut+'<br/><b>Nombre:</b>'+req.body.nombre+'<br/><b>Correo:</b>'+req.body.correo+'<br/><b>Telefono:</b>'+req.body.telefono+'<br/><b>Mensaje:</b>'+req.body.mensaje+'<br/><b>Fecha:</b>'+req.body.semana+' '+req.body.dia+' '+req.body.mes+' '+req.body.ano+' a las '+req.body.hora+'<br/>'
	};
	var params = { 
		Destination: { 
			ToAddresses: [] 
		}, 
		Message: { 
			Body: { 
				Html: { 
					Charset: 'UTF-8', Data: '' 
				} 
			}, 
			Subject: { 
				Charset: 'UTF-8', Data: '' 
			}
		}, 
		ReturnPath: 'misitiodelivery@gmail.com', 
		Source: 'misitiodelivery@gmail.com'
	};

	params.Destination.ToAddresses.push(mailOptions2.to);
	params.Message.Subject.Data = mailOptions2.subject;
	params.Message.Body.Html.Data = mailOptions2.body;

	ses.sendEmail(params, (err, data) => { 
		if(!err){
			//res.end(JSON.stringify({ op: 1 }));
		}else{
			//res.end(JSON.stringify({ op: 2 }));
		}
	});

	var aux_theme = reserva_theme;

	aux_theme = aux_theme.replace(/#ID#/g, req.body.id);
	aux_theme = aux_theme.replace(/#CODE#/g, req.body.code);
	aux_theme = aux_theme.replace(/#NOMBRE#/g, req.body.nombre);
	aux_theme = aux_theme.replace(/#HORA#/g, req.body.hora);
	aux_theme = aux_theme.replace(/#SEMANA#/g, req.body.semana);

	aux_theme = aux_theme.replace(/#DIA#/g, req.body.dia);
	aux_theme = aux_theme.replace(/#MES#/g, req.body.mes);
	aux_theme = aux_theme.replace(/#ANO#/g, req.body.ano);
	
	aux_theme = aux_theme.replace(/#PROFESIONAL#/g, req.body.profesional);
	//aux_theme = aux_theme.replace(/#ESPECIALIDAD#/g, req.body.especialidad);

	var mailOptions1 = {
		from: 'misitiodelivery@gmail.com',
		to: req.body.correo,
		subject: 'Nueva Reserva',
		html: aux_theme
	};
	var transporter = nodemailer.createTransport('smtps://misitiodelivery@gmail.com:dVGbBSxi9Hon8Bqx@smtp.gmail.com');
	transporter.sendMail(mailOptions1, function(err, info){
		if(!err){
			res.end(JSON.stringify({ op: 1 }));
		}else{
			res.end(JSON.stringify({ op: 2 }));
		}
	});

});


/*
const request = require('request');
const http = require("http");

var download = function(url, dest, cb) {
	var file = fs.createWriteStream(dest);
	http.get(url, function(response) {
		response.pipe(file);
		file.on('finish', function() {
			file.close(cb);  // close() is async, call cb after close completes.
		});
	});
}
app.get('/get_videos', function(req, res){
	request('http://jardinvalleencantado.cl/online/videos/', function (error, response, body){
		var x = JSON.parse(body);
		x.forEach(element => {
			download('http://jardinvalleencantado.cl/online/videos/'+element, '/var/nodejs/videos/'+element, function(){ console.log(element+" => copiado"); });
		});
	});
});
*/