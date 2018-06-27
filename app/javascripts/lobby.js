function lobbyScene(FBInstant) {
    this.start = function() {
        console.log("Not playing on a context");
        var sceneRoot = document.getElementById('scene');
        var message = document.createElement('p');
        message.appendChild(document.createTextNode('Please choose an opponent.'));

        var button = document.createElement('input');
        button.type = 'button';
        button.className = 'button';
        button.value = 'Select opponent';
        button.onclick = function() {
            FBInstant.context.chooseAsync() 
        }
        sceneRoot.insertBefore(message, sceneRoot.firstChild);
    }
}