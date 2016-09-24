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
    socket.on('message', function(data) {
        $scope.sessionid = data;
        console.log($scope.sessionid);
    });
    socket.on('chat message', function(data) {
        $scope.$apply(function () {
            $scope.users=[];
            for(i=0;i<data.length;i++){
                $scope.users.push(data[i]);
                if (data[i].connection_id==$scope.sessionid){
                    $scope.user=data[i];
                }
            }
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
            $http({method: 'POST',url:'http://localhost:8080/confirmed', data:data, headers:{
                'Content-Type': 'application/json'
            }})
        }, function() {
            data['confirm']="No";
            
            $http({method: 'POST',url:'http://localhost:8080/confirmed', data:data, headers:{
                'Content-Type': 'application/json'
            }})
        });
    };
    console.log($scope.status);
    

    socket.on('private message', function(data) {
        $scope.showConfirm(data);
    });
    
    socket.on('friend', function(data) {
        console.log("Connection Established");
        $scope.chat(data.my_handle, data.friend_handle);
    });
    
    $scope.friend_request = function(user) {   
        $scope.friend = user;
    };
    
    $scope.live_chat=[];
    
    $scope.chat = function(my_handle, friend_handle){
        $scope.live_chat.push(my_handle+" "+friend_handle);
        $scope.$apply();
        console.log("livechat"+$scope.live_chat);
        socket.on(my_handle+" "+friend_handle,function(msg){
            console.log('message  :'+msg);
        }); 
    };
    
    $scope.send_message=function(chat,message){
        console.log(chat+message);
        socket.emit(chat,message);
    }
    
    $scope.confirm=function(){

        console.log("Sss"+$scope.friend.connection_id);
        var data = {
            "friend_handle":$scope.friend.handle,
            "friend_id":$scope.friend.connection_id,
            "my_handle":$scope.user.handle,
            "my_id":$scope.user.connection_id
        };

        var config = {
            headers : {
                'Content-Type': 'application/json'
            }
        }
        $http({method: 'POST',url:'http://localhost:8080/confirm', data:data, headers:config})
            .success(function (data) {
            console.log(data)
        })
            .error(function (data) {
            console.log(data)
        });
    };
}]);
