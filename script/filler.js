
var nickname  = prompt('What is your nickname ?');
if (nickname==null){
    document.location.href='./error.html';
}
while(nickname===''){
    nickname  = prompt('What is your nickname ?'); 
}

var socket = io();

socket.emit('login', {user: nickname});
document.title = nickname + ' - ' + document.title; 
  
socket.on('add', function(data){
    addMessage(data, 'added');
    addNewtodo(data);
});

socket.on('remove', function(data){
    addMessage(data, 'removed');
    $("#todolist li").eq(data.task).remove();
});

socket.on('messageLog', function(data){  
    addMessageLog(data);
});

socket.on('loadTodolist', function(todolist){
     $('#todolist').empty();
     
      //for (var i = 0, len = a.length; i < len; i++){
     todolist.forEach(function(item, index) {
        addNewtodo(item);
     });           
});


socket.on('connectedUsersList', function(connectedUsers){
     $('#usersList').empty();
     connectedUsers.forEach(function(item, index) {
        addUser(item);
     });           
});


$("#todolist").on("click", "button", function() {
    var id = $(this).closest('li').index();
    socket.emit('remove', id);
    //$(this).closest('li').remove();    
    return false;
}); 

 $('#formulaire_todolist').submit(function(){
   var newtodo = $('#newtodo').val();
   newtodo = newtodo.trim();
   if(newtodo.length !== 0){
       socket.emit('add', newtodo);
       //addNewtodo({newtodo});
       $('#newtodo').val('').focus();
   }
   return false;
});

function addMessage(data, action){
    $('#message li').empty();
    if(isNaN(data.task)){
        $('#message li').append(data.user +' has '+ action +' one task: "'+ data.name + '"');
    }else{
        var task = $("#todolist li h3").eq(data.task).html();
        task = task.trim();
        //var result = task.split("</a>");
        //var result = task.replace(/<a [^>]+>[^<]*<\/a>/, '');
        $('#message li').append(data.user +' has '+ action +' one task: "'+  task +'"');
        //$('#message').append(data.pseudo +' a '+action+' la tâche: '+  result);
    }
}

function addMessageLog(data){
    $('#message li').empty();
    $('#message li').append(data.user +' has '+ data.message);
}

function addNewtodo(newtodo){
    var str = '<li class="list-group-item" id="'+ newtodo.id +'"><h3>'+ newtodo.name +' </h3>';
    str += '<h5><span class="glyphicon glyphicon-time"></span> Post by '+ newtodo.user +', '+ newtodo.date +'.</h5>'
    str+='<br><button type="button" class="btn btn-danger">delete</button></li>';
    $('#todolist').append(str);
}

function addUser(user){
    $('#usersList').append('<li class="text-danger">'+ user +'</li>');
}  

