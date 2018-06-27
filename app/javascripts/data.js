function backendClient(backendUrl) {
    this.request = function(url, method, params) {
        var ignoreCache = function(url) {
            var randomNumber = Math.random();
            return url + '?ignore_cache=' + randomNumber
        }

        return new Promise(function(resolve, reject) {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
                {
                    var json = JSON.parse(xmlhttp.responseText);
                    if (json.success) {
                        resolve(json);
                    } else {
                        reject(json.error);
                    }
                }

            }
            xmlhttp.onerror = function(err) {
                reject(err);
            }
            xmlhttp.open(method, url, true);
            xmlhttp.setRequestHeader('Content-Type', 'application/json');
            xmlhttp.send(JSON.stringify(params));
        });

    };

    this.save = function(contextId, player, signature) {
        var url = backendUrl + '/save-match';
        var method = 'POST';
        var payload = {'contextId': contextId, 'signature': signature, 'player': player};
        return this.request(url, method, payload);
    };

    this.load = function(signature) {
        var url = backendUrl + '/get-match'
        var method = 'POST'
        var payload = {'signature': signature};
        return this.request(url, method, payload);
    };

}