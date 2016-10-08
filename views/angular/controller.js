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
    $scope.friends=[];

    socket.on('handle', function(data) {
        $scope.user = data;
    });

    var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October","November", "December"];

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

    socket.on('message', function(data) {
        $scope.showConfirm(data);
    });

    socket.on('friend', function(data) {
        console.log("Connection Established"+data);
        $scope.$apply(function () {
            if (!$scope.friends.includes(data)){
                $scope.friends.push(data);
            }

        });
    });

    $scope.friend_request = function(user) {   
        $scope.friend = user;
    };

    var getDate=function(){
        date = new Date();
        hour=date.getHours();
        period="AM";
        if (hour>12){
            hour=hour%12;
            period="PM";
        }
        form_date=monthNames[date.getMonth()]+" "+date.getDate()+", "+hour+":"+date.getMinutes()+" "+period;
        return form_date;        
    }

    socket.on('private message', function(data) {        
        var div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg right">\
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-right">'+data.split("#*@")[2]+'</span>\
                        <span class="direct-chat-timestamp pull-left">'+getDate()+'</span>\
                        </div>\
                        <img class="direct-chat-img" src="/views/dist/img/user3-128x128.jpg" alt="message user image">\
                        <div class="direct-chat-text">'
                        +data.split("#*@")[1]+
                        '</div>\
                        </div>';
        document.getElementById(data.split("#*@")[2]).appendChild(div);
        document.getElementById(data.split("#*@")[2]).scrollTop=document.getElementById(data.split("#*@")[2]).scrollHeight;        
    });

    $scope.send_message=function(chat,message){
        div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg"> \
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-left">'+$scope.user+'</span>\
                        <span class="direct-chat-timestamp pull-right">'+getDate()+'</span>\
                        </div>\
                        <img class="direct-chat-img" src="/views/dist/img/user1-128x128.jpg"\ alt="message user image">\
                        <div class="direct-chat-text">'
                        +message+
                        '</div>\
                        </div>';
        document.getElementById(chat).appendChild(div);
        document.getElementById(chat).scrollTop=document.getElementById(chat).scrollHeight;
        socket.emit('private message',chat+"#*@"+message+"#*@"+$scope.user);
        $scope.message=null;
    }

    $scope.confirm=function(){
        var data = {
            "friend_handle":$scope.friend,
            "my_handle":$scope.user
        };

        var config = {
            headers : {
                'Content-Type': 'application/json'
            }
        };

        $http({method: 'POST',url:'http://localhost:8080/friend_request', data:data, headers:config})
            .success(function (data) {
            console.log(data)
        })
            .error(function (data) {
            //add error handling
            console.log(data)
        });
    };
}]);


app.directive('myEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.myEnter);
                });

                event.preventDefault();
            }
        });
    };
});