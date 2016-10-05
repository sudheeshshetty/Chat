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
    
//    $scope.send_message=function(chat,message){
//        console.log(chat+message);
//        socket.emit(chat,message);
//    }
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
