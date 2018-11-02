
var nickname  = prompt('What is your nickname ?');
if (nickname==null){
    document.location.href='./error.html';
}
while(nickname===''){
    nickname  = prompt('What is your nickname ?'); 
}

var socket = io();

socket.emit('login', {pseudo: nickname});
document.title = nickname + ' - ' + document.title; 
  
socket.on('add', function(data){
    addMessage(data, 'added');
    addNewtodo(data.task);
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


$("#todolist").on("click", "a", function() {
    var id = $(this).closest('li').index();
    socket.emit('remove', id);
    $(this).closest('li').remove();    
    return false;
}); 

 $('#formulaire_todolist').submit(function(){
   var newtodo = $('#newtodo').val();
   socket.emit('add', newtodo);
   addNewtodo(newtodo);
   $('#newtodo').val('').focus();
   return false;
});

function addMessage(data, action){
    $('#message li').empty();
    if(isNaN(data.task)){
        $('#message li').append(data.pseudo +' has '+ action +' one task: "'+ data.task + '"');
    }else{
        var task = $("#todolist li").eq(data.task).html();
        var result = task.split("</a>");
        //var result = task.replace(/<a [^>]+>[^<]*<\/a>/, '');
        $('#message li').append(data.pseudo +' has '+ action +' one task: "'+  result[1] +'"');
        //$('#message').append(data.pseudo +' a '+action+' la tâche: '+  result);
    }
}

function addMessageLog(data){
    $('#message li').empty();
    $('#message li').append(data.pseudo +' has '+ data.message);
}

function addNewtodo(newtodo){
    $('#todolist').append('<li class="list-group-item"><a href="#_">✘</a>'+ newtodo +'</li>');
}

function addUser(user){
    $('#usersList').append('<li class="text-danger">'+ user +'</li>');
}  

