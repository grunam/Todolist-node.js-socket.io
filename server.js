
var todolist = []; 
var connectedUsers = [];

var express = require('express'),
 app = express(),  
 server = require('http').createServer(app),
 io = require('socket.io')(server),
 ent = require('ent'),

session = require("express-session"),
FileStore = require('session-file-store')(session),
sharedsession = require("express-socket.io-session");

 
app.use(express.static('./'))
.use(session)
.get('/', function(req, res){
     res.sendFile(__dirname + '/index.html');
 })
.use(function(req, res, next){
   res.redirect('/');         
});
 
io.use(sharedsession(session({
    secret: "my-secret",
    resave: true,
    saveUninitialized: true,
    store: new FileStore()
})), {
    autoSave:true
}); 

io.on('connection', function(socket){
    
    socket.emit('loadTodolist', todolist);

     socket.on("login", function(data) {
        pseudo = ent.encode(data.pseudo);
        socket.handshake.session.userdata = pseudo;
        socket.handshake.session.save();
        socket.broadcast.emit('messageLog', {pseudo: socket.handshake.session.userdata, message: '<u>logged in !</u>'});
        connectedUsers.push(pseudo);
        io.sockets.emit('connectedUsersList', connectedUsers);
        
    });
    
    
     socket.on('add', function(newtodo){
        newtodo = ent.encode(newtodo);
        todolist.push(newtodo);
        socket.broadcast.emit('add', {pseudo: socket.handshake.session.userdata, task: newtodo});
     })
     
     socket.on('remove', function(id){
         todolist.splice(id, 1);
         socket.broadcast.emit('remove', {pseudo: socket.handshake.session.userdata, task: id});
     })
     
     socket.on('disconnect', function() {
        if (socket.handshake.session.userdata) {
            socket.broadcast.emit('messageLog', {pseudo: socket.handshake.session.userdata, message: '<u>logged out !</u>'});
            connectedUsers.splice(connectedUsers.indexOf(socket.handshake.session.userdata), 1);
            socket.broadcast.emit('connectedUsersList', connectedUsers);
            delete socket.handshake.session.userdata;
            socket.handshake.session.save();
        }
    });  
 
}); 

 server.listen(9999);


