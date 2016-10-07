var app = angular.module('myapp',['ngMaterial']);

app.factory('socket', ['$rootScope', function($rootScope) {
    var socket = io.connect();

    return {
        on: function(eventName, callback){
            socket.on(eventName, callback);
        },
        emit: function(eventName, data) {
            socket.emit(eventName, data);
        }
    };
}]);

app.controller('myController',['$scope','socket','$http','$mdDialog',function($scope,socket,$http,$mdDialog){
    $scope.users=[];
    socket.on('handle', function(data) {
        $scope.user = data;
    });
    $scope.friends=[];
    socket.on('users', function(data) {
        $scope.$apply(function () {
            $scope.users=[];
            for(var i in data){
                if (i!=$scope.user){
                    $scope.users.push(i);
                }
            }
            console.log($scope.users);
        });
    });
    
    
    $scope.showConfirm = function(data) {
        // Appending dialog to document.body to cover sidenav in docs app
        var confirm = $mdDialog.confirm()
        .title(" connection request ")
        .textContent(data.my_handle+' wants to connect.Do you want to Connect?')
        .ariaLabel('Lucky day')
        .ok('Ok')
        .cancel('No');

        $mdDialog.show(confirm).then(function() {
            data['confirm']="Yes";
            $http({method: 'POST',url:'http://localhost:8080/friend_request/confirmed', data:data, headers:{
                'Content-Type': 'application/json'
            }})
        }, function() {
            data['confirm']="No";
            
            $http({method: 'POST',url:'http://localhost:8080/friend_request/confirmed', data:data, headers:{
                'Content-Type': 'application/json'
            }})
        });
    };
//    console.log($scope.status);
    

    socket.on('message', function(data) {
        $scope.showConfirm(data);
    });
    
    socket.on('friend', function(data) {
        console.log("Connection Established"+data);
        $scope.$apply(function () {
            $scope.friends.push(data);
        });
    });
    
    $scope.friend_request = function(user) {   
        $scope.friend = user;
    };
    
//    $scope.live_chat=[];
//    
//    $scope.chat = function(my_handle, friend_handle){
//        $scope.live_chat.push(my_handle+" "+friend_handle);
//        $scope.$apply();
//        console.log("livechat"+$scope.live_chat);
//        socket.on(my_handle+" "+friend_handle,function(msg){
//            console.log('message  :'+msg);
//        }); 
//    };
    
    socket.on('private message', function(data) {
        console.log(data.split("#*@")[0]+" "+data.split("#*@")[1]);
        var d = document.createElement('div');
        str='<div class="direct-chat-msg right">\
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-right">'+data.split("#*@")[2]+'</span>\
                        <span class="direct-chat-timestamp pull-left">23 Jan 2:05 pm</span>\
                        </div>\
                        <img class="direct-chat-img" src="/views/dist/img/user3-128x128.jpg" alt="message user image">\
                        <div class="direct-chat-text">'
                        +data.split("#*@")[1]+
                        '</div>\
                        </div>';
        console.log(str);
        d.innerHTML=str;
        document.getElementById(data.split("#*@")[2]).appendChild(d);
        document.getElementById(data.split("#*@")[2]).scrollTop=document.getElementById(data.split("#*@")[2]).scrollHeight;
        $scope.data.split("#*@")[0]=[];
        $scope.data.split("#*@")[0].push(data.split("#*@")[1]);
        
    });
    
    $scope.send_message=function(chat,message){
        console.log(chat+" "+message);
        div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg"> \
                                                  <div class="direct-chat-info clearfix">\
                                                  <span class="direct-chat-name pull-left">'+$scope.user+'</span>\
                                                  <span class="direct-chat-timestamp pull-right">23 Jan 2:00 pm</span>\
                                                  </div>\
                                                  <img class="direct-chat-img" src="/views/dist/img/user1-128x128.jpg"\ alt="message user image">\
                                                  <div class="direct-chat-text">'
                                                  +message+
                                                  '</div>\
                                                  </div>';
        document.getElementById(chat).appendChild(div);
        document.getElementById(chat).scrollTop=document.getElementById(chat).scrollHeight;
        socket.emit('private message',chat+"#*@"+message+"#*@"+$scope.user);
    }
//    socket.emit('depart',$scope.user);
    
    $scope.confirm=function(){

        console.log("Sss"+$scope.friend);
        var data = {
            "friend_handle":$scope.friend,
            "my_handle":$scope.user
        };
        console.log(data);

        var config = {
            headers : {
                'Content-Type': 'application/json'
            }
        }
        $http({method: 'POST',url:'http://localhost:8080/friend_request', data:data, headers:config})
            .success(function (data) {
            console.log(data)
        })
            .error(function (data) {
            console.log(data)
        });
    };
}]);
app.directive('myMsg',function(){
    return {
        template: 'Name: {{customer.name}} Address: {{customer.address}}'
    };
});