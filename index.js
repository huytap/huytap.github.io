var credentials = require('./model');
var express = require('express');
var app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
const {json} = require('body-parser');
//var cors = require('cors');
const mysql = require('mysql');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var https = require('https');
var datetime = require('node-datetime');

var port = process.env.PORT || 3001;

app.use(json());
//app.use(cors());

const con = mysql.createPool({
  connectionLimit: 50,
  host: credentials.host,
  user: credentials.user,
  pass: credentials.pass,
  database: credentials.db
})

io.on('connection', function(socket){
  console.log('Co nguoi ket noi')
  socket.on('disconnect', () => {
    console.log('user disconnected')
  });
  //get List
  socket.on("client-getdata", function(){
    con.getConnection((error, connection) => {
      if(error){
        connection.release();
        socket.emit('server-getdata-fail', error);
      }else{
        connection.query('SELECT * FROM song', function(error, rows, fields){
          connection.release();
          if(error) socket.emit('server-getdata-fail', error.message);
          socket.emit('server-getdata', rows);
        })
      }
    })
  });
  //add clip
  socket.on('client-addclip', function(data){
    con.getConnection((error, connection) => {
      if(error){
        connection.release();
        socket.emit('server-getdata-fail', error);
      }else{
        const youtubeLink = "https://www.youtube.com/oembed?url="+data +"&format=json";
        const parseUri = require('parseuri')(data);
        
        if(parseUri.query.length){
          const checkVideoId = parseUri.query.split('v=');
          if(checkVideoId.length && checkVideoId[1].length === 11){
            https.get(youtubeLink, (resp) => {
              resp.setEncoding('utf8');
              resp.on('data', function (body) {
                //console.log(body)
                body = JSON.parse(body);
                if(body){
                  connection.query("SELECT link FROM song WHERE link=?", checkVideoId[1], function(error, row){
                    //connection.release();
                    if(error) socket.emit('server-getdata-fail', error.message);
                    if(row.length>0){
                      socket.emit('server-addclip-fail', 'Clip này đã có trong danh sách phát nhạc');
                    }else{
                      var dt = datetime.create();
                      var formatted = dt.format('Y-m-d H:M:S');
                      const song = {id: null, name: body.title, description: '', cover_photo: body.thumbnail_url, link: checkVideoId[1], chanel_id: 0, current: 0, added_date: formatted, updated_date: formatted, updated_by:0}
                      connection.query("INSERT INTO song SET ?", song, function(error, result){
                        connection.release();
                        if(error) socket.emit('server-getdata-fail', error.message);
                        io.sockets.emit('server-addclip', {name: body.title, link: checkVideoId[1]});               
                      })
                    }
                  })
                }
              });
            });
          }
        }else{
          socket.emit('server-getdata-fail', error);
        }
      }
    })
  });

  //remove clip
  socket.on('client-removeclip', function(data){
    con.getConnection((error, connection) => {
      if(error){
        connection.release();
        res.send({success: false, message: error})
      }else{
        connection.query('DELETE FROM song WHERE link=?', data, function(error, result){
          connection.release();
          if(error) socket.emit('server-getdata-fail', error.message);
          io.sockets.emit('server-removeclip', data);
        });
      }
    })
  });

  //select clip

  socket.on('client-selectclip', function(data){
    con.getConnection((error, connection) => {
      if(error){
        connection.release();
        socket.emit('server-getdata-fail', error);
      }else{
        connection.query('UPDATE song set current = 0');
        connection.query('UPDATE song set current = 1 WHERE link=?', data, function(error, result){
          connection.release();
          if(error) socket.emit('server-getdata-fail', error.message);
          io.sockets.emit('server-selectclip', data);
          // connection.query('SELECT `name`,`link` FROM song WHERE id='+id, function(error, rows){
          //   if(error) socket.emit('server-getdata-fail', error.message);
          //   connection.release();
          //   res.send({success: true, videoId: rows[0]['link']})  
            
          //   io.sockets.emit("Change-clip-server-send", rows[0]['link']);
            
          // });
        })
      }
    })
  })

});


server.listen(port, function(){
  console.log('listening on *:'+port);
});

app.get('/', function(req, res){
  
  res.render('index');
})