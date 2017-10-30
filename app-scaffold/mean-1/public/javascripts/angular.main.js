var app = angular.module('app', ['ngRoute', 'ngFileUpload']);
var serverip = 'nb-sst';

app.config(function($locationProvider,$routeProvider) {
    $locationProvider.hashPrefix('');
    $routeProvider
        .when('/receipts', {
            templateUrl: '/templates/receipts.html',
            controller: 'receiptsContr'
        })
        .otherwise({
            redirectTo: '/receipts'
        });
});

app.controller('receiptsContr', function($location,$scope,$http, Upload) {

    $scope.selectedReceipt = null;
    $scope.receiptTypes = [
        {id: '0', name: 'AB'},
        {id: '1', name: 'Lieferschein'},
        {id: '2', name: 'Rechnung/Quittung/Zahlungsbeleg'},
        {id: '9', name: 'Sonstiger Beleg'}
    ];

    $http.get('http://' + serverip + ':3015/api/receipts')
        .then(
            function(rs){
                $scope.receipts = rs.data;
            },
            function(data){console.log(data);}
        );

    if ($location.search().ref){
        $http.get('http://' + serverip + ':3015/api/receipt/' + $location.search().ref)
            .then(
                function(rs){
                    $scope.loadReceipt(rs.data);
                },
                function(data){console.log(data);}
            );
    }

    $scope.submit = function() {
        if ($scope.form.file.$valid && $scope.file) {
            $scope.upload($scope.file);
        }
    };
    $scope.upload = function (file) {
        console.log(file);

        Upload.upload({
            url: 'api/upload2',
            data: {
                file: file,
                height: file.$ngfHeight,
                width: file.$ngfWidth,
                rotation: 0
            }
        }).then(function (resp) {
            //console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ');
            console.log(resp.data);
            $scope.selectedReceipt = resp.data;
        }, function (resp) {
            console.log('Error status: ' + resp.status);
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });
    };

    $scope.createReceipt = function(){
        $scope.selectedReceipt = null;
    };

    $scope.loadReceipt = function(r){
        $scope.selectedReceipt = r;
        $scope.selectedReceipt.date = new Date($scope.selectedReceipt.date);
        
        // load atx
        $scope.selectedReceipt.atx = [];
        $scope.selectedReceipt.ref_atx.forEach(function(atxId){
            $http.get('http://' + serverip + ':3016/api/transaction/' + atxId)
                .then(
                    function(tx){
                        $scope.selectedReceipt.atx.push(tx.data);
                    },
                    function(data){console.log(data);}
                );

        });
        
    };

    $scope.rotateImage = function(r,filepath,imgId,deg){
        $("#" + imgId).attr("src", 'images/Loading_icon.gif');
        data = {
            filepath : filepath,
            deg: deg
        };
        $http.post('http://' + serverip + ':3015/api/rotateImage', data)
            .then(function(result){
                $("#" + imgId).attr("src", filepath + '?' + new Date().getTime());
                //$scope.selectedReceipt = r;
                console.log('rotation successfull ' + imgId);
            },function(data){console.log(data)})
    };


    $scope.saveReceipt = function(r){
        $http.put('http://' + serverip + ':3015/api/receipt/' + r.reference, r)
            .then(function(result){
                document.getElementById('snackbar1').dataset.content = 'Beleg gespeichert!';
                $('#snackbar1').snackbar('show');
            },function(data){
                console.log(data);
            });
    };


    /* ATX */
    $scope.ATX = null;
    $scope.createATXModal = function(r){
        var amtLeft = r.amount;
        r.atx.forEach(function(tx){
            amtLeft -= tx.amount;
        });
        $scope.ATX = {
            from: r.receipient,
            to: '',
            amount: amtLeft,
            date: r.date,
            ref1:r.reference
        }
    };
    $scope.createATX = function(){
        $http.post('http://' + serverip + ':3016/api/transaction', $scope.ATX)
            .then(function(result){
                $scope.selectedReceipt.ref_atx.push(result.data._id);
                $scope.selectedReceipt.atx.push(result.data);
                $http.put('http://' + serverip + ':3015/api/receipt/' + $scope.selectedReceipt.reference, $scope.selectedReceipt)
                    .then(function(result){
                        document.getElementById('snackbar1').dataset.content = 'Transaction gespeichert!';
                        $('#snackbar1').snackbar('show');
                    },function(data){
                        console.log(data);
                    });
                $scope.ATX = null;

            },function(data){
                console.log(data);
            });
    };


});

app.controller('fileUploader', function($scope, Upload) {

    $scope.submit = function() {
        if ($scope.form.file.$valid && $scope.file) {
            $scope.upload($scope.file);
        }
    };

    // upload on file select or drop
    $scope.upload = function (file) {
        console.log(file);

        Upload.upload({
            url: 'api/upload2',
            data: {
                file: file,
                height: file.$ngfHeight,
                width: file.$ngfWidth,
                rotation: 0
            }
        }).then(function (resp) {
            //console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ');
            console.log(resp.data);
            $scope.selectedReceipt = resp.data;
        }, function (resp) {
            console.log('Error status: ' + resp.status);
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
        });
    };



});
