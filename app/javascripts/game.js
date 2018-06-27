function gameplayScene(FBInstant, backendClient, html2canvas) {
    this._cells = [[],[],[]];
    this._matchData = {};
    this.SPRITES = ['love', 'like'];
    
    this.start = function() {
        this.makeGrid();
        var contextId = FBInstant.context.getID();
        FBInstant.player.getSignedPlayerInfoAsync(contextId)
        .then(function(signedPlayerInfo){
            console.log(signedPlayerInfo.getSignature());
            return backendClient.load(signedPlayerInfo.getSignature());
        })
        .then(function(result){
            console.log(result);
            if (result.empty) {
                return this.createNewGameAsync();
            } else {
                return Promise.resolve(result.data);
            }
        }.bind(this))
        .then(function(backendData){
            this.populateFromBackend(backendData);
        }.bind(this))
        .catch(function(error){
            this.displayError(error);
        }.bind(this));
    };
    
    this.makeGrid = function() {
        var sceneRoot = document.getElementById('scene');
        
        var table = document.createElement('table');
        var bgc = 1;
        table.className = "gamegrid";
        for (var j=0; j<3; j++){
            var rowEl = document.createElement('tr');
            for (var k=0; k<3; k++) {
                var cellEl = document.createElement('td');
                cellEl.className = bgc ? "blue" : "grey";
                bgc ^= 1;
                var img = document.createElement('img');
                img.src = '/images/fill.png';
                img.className = 'sprite';
                cellEl.appendChild(img);
                rowEl.appendChild(cellEl);
                this._cells[j].push(cellEl);
            }
            table.appendChild(rowEl);
        }
        sceneRoot.appendChild(table);
    }
    
    this.populateFromBackend = function(matchData) {
        this._matchData = JSON.parse(matchData);
        var playerId = FBInstant.player.getID();
        if (this._matchData.players.length == 1 && this._matchData.players[0] !== playerId) {
            // This player just accepted a challenge.
            // We need to persist their ID as the second player
            this._matchData.players.push(playerId);
        }
        
        var playerIndex = this._matchData.players.indexOf(playerId);
        for (var j=0; j<3; j++){
            for (var k=0; k<3; k++) {
                var cell = this._cells[j][k];
                cell._row = j;
                cell._column = k;
                if (this._matchData.cells[j][k] !== -1) {
                    this.addSpriteToCell(cell, this.SPRITES[this._matchData.cells[j][k]]);
                } else {
                    cell.onclick= function(event) {
                        this.onCellClick(event);
                    }.bind(this);
                }
            }
        }
        if (this._matchData.playerTurn !== playerIndex) {
            console.log("It's not this player's turn, let's display a message");
            var sceneRoot = document.getElementById('scene');
            var message = document.createElement('p');
            message.appendChild(document.createTextNode('Please wait your turn.'));
            sceneRoot.insertBefore(message, sceneRoot.firstChild);
            this.disableAllCells();
        }
    }
    
    this.createNewGameAsync = function() {
        var playerId = FBInstant.player.getID();
        this._matchData = {
            'cells': [[-1,-1,-1],[-1,-1,-1],[-1,-1,-1]],
            'playerTurn': 0,
            'players': [
                playerId
            ],
        }
        return new Promise(function(resolve, reject){
            this.saveDataAsync()
            .then((savedData) => resolve(JSON.stringify(savedData)))
            .catch(reject);
        }.bind(this));
    }
    
    this.saveDataAsync = function() {
        var matchData = this._matchData;
        return new Promise(function(resolve, reject){
            console.log('going to save', JSON.stringify(matchData));
            FBInstant.player
            .getSignedPlayerInfoAsync(JSON.stringify(matchData))
            .then(function(result){
                return backendClient.save(
                    FBInstant.context.getID(),
                    result.getPlayerID(),
                    result.getSignature()
                )
            })
            .then(function(){
                resolve(matchData);
            })
            .catch(function(error){
                reject(error);
            })
        });
    }
    
    this.addSpriteToCell = function(cell, spriteName) {
        cell.removeChild(cell.firstChild);
        var img = document.createElement('img');
        img.src = '/images/' + spriteName + '.png';
        img.className = 'sprite';
        cell.appendChild(img);
    };
    
    this.disableAllCells = function() {
        for (var j=0; j<3; j++){
            for (var k=0; k<3; k++) {
                var cell = this._cells[j][k];
                cell.onclick = null;
            }
        }
    }
    
    this.displayError = function(error) {
        console.log('Error loading from backend', error);
    }
    
    this.onCellClick = function(event) {
        var sourceElmt = event.srcElement;
        var cell = null;
        if (sourceElmt.tagName === 'IMG') {
            cell = sourceElmt.parentNode;
        } else {
            cell = sourceElmt;
        }
        this.addSpriteToCell(cell, this.SPRITES[this._matchData.playerTurn]);
        this.disableAllCells();
        this._matchData.cells[cell._row][cell._column] = this._matchData.playerTurn;
        this._matchData.playerTurn ^= 1;
        
        this.saveDataAsync()
        .then(function(){
            return this.getPlayerImageAsync()
        }.bind(this))
        .then(function(image){
            var updateConfig = this.getUpdateConfig(image)
            return FBInstant.updateAsync(updateConfig)
        }.bind(this))
        .then(function() {
            // closes the game after the update is posted.
            FBInstant.quit();
        });        
    }
    
    this.getUpdateConfig = function(base64Picture) {
        
        var isMatchWon = this.isMatchWon();
        var isBoardFull = this.isBoardFull();
        var updateData = null;
        var playerName = FBInstant.player.getName();
        
        if (isMatchWon) {
            // Game over, player won
            updateData =
            {
                action: 'CUSTOM',
                cta: 'Rematch!' ,
                image: base64Picture,
                text: {
                    default: playerName + ' has won!',
                    localizations: {
                        pt_BR: playerName + ' venceu!',
                        en_US: playerName + ' has won!',
                        de_DE: playerName + ' hat gewonnen'
                    }
                },
                template: 'match_won',
                data: { rematchButton:true },
                strategy: 'IMMEDIATE',
                notification: 'NO_PUSH',
            };
            
        } else if (isBoardFull) {
            // Game over, tie
            updateData =
            {
                action: 'CUSTOM',
                cta: 'Rematch!' ,
                image: base64Picture,
                text: {
                    default: 'It\'s a tie!',
                    localizations: {
                        pt_BR: 'Deu empate!',
                        en_US: 'It\'s a tie!',
                        de_DE: 'Es ist ein unentschiedenes Spiel!'
                    }
                },
                template: 'match_tie',
                data: { rematchButton:true },
                strategy: 'IMMEDIATE',
                notification: 'NO_PUSH',
            };
        } else {
            // Next player's turn
            updateData =
            {
                action: 'CUSTOM',
                cta: 'Play your turn!' ,
                image: base64Picture,
                text: {
                    default: playerName + ' has played. Now it\'s your turn',
                    localizations: {
                        pt_BR: playerName + ' jogou. Agora é sua vez!',
                        en_US: playerName + ' has played. Now it\'s your turn',
                        de_DE: playerName + ' hat gespielt. Jetzt bist du dran.'
                    }
                },
                template: 'play_turn',
                data: { rematchButton: false },
                strategy: 'IMMEDIATE',
                notification: 'NO_PUSH',
            };
        }
        
        return updateData;
        
    }
    
    this.isMatchWon = function() {
        function checkMatchAll(cells) {
            return (cells[0] != -1) && (cells[0] == cells[1]) && (cells[1] == cells[2]);
        }

        var cells = this._matchData.cells;
        
        var matchRow = 
            checkMatchAll(cells[0]) || 
            checkMatchAll(cells[1]) || 
            checkMatchAll(cells[2]);
        var matchColumn = 
            checkMatchAll([cells[0][0], cells[1][0], cells[2][0]]) ||
            checkMatchAll([cells[0][1], cells[1][1], cells[2][1]]) ||
            checkMatchAll([cells[0][2], cells[1][2], cells[2][2]]);
        var matchAcross = 
            checkMatchAll([cells[0][0], cells[1][1], cells[2][2]]) ||
            checkMatchAll([cells[2][0], cells[1][1], cells[0][2]]);
        
        var won = matchRow || matchColumn || matchAcross;
        return won;
    };
    
    this.isBoardFull = function() {
        for (var j=0; j<3; j++){
            for (var k=0; k<3; k++) {
                if (this._matchData.cells[j][k] == -1) {
                    return false;
                }
            }
        }
        return true;
    }
    
    this.getPlayerImageAsync = function() {
        return new Promise(function(resolve, reject){
            var sceneRoot = document.getElementById('scene');
            var sceneWidth = sceneRoot.offsetWidth;
            html2canvas(sceneRoot, {width:sceneWidth*3, x:-(sceneWidth)})
                .then(function(canvas){
                    resolve(canvas.toDataURL("image/png"));
                })
                .catch(function(err){
                    reject(err);
                })
        })

    }
}