# Instant Game Communication Demo

This demo contains code that demonstrates the more important types of interactions that an Instant Game client can have with backend services: sending/receiving payloads to Game Bot and saving/retrieving data to a custom backend.

## Pre-requisites

To run this demo, you will need:
1. Yarn ([Install Yarn](https://yarnpkg.com/en/docs/install))
1. A Facebook App configured as an Instant Game. ([More information](https://developers.facebook.com/docs/games/instant-games/getting-started/game-setup))
1. The [server-side counterpart](https://github.com/edgarjcfn/fbinstant-server) to this demo running in a cloud-based service, like Heroku, AWS or Google Cloud

## Install dependencies 
After checking out the code, run
```sh
$ cd /path/to/fbinstant-new
$ yarn install
...
$ cp config.template.json config.json # create config file
```

## Configuration
You will need to provide your app's information in `config.json`

Paste your App ID and App Upload Access Token. The latter can be found by clicking the **Get Asset Upload Access Token** button in your app's Web Hosting configuration (`https://developers.facebook.com/apps/<YOUR_APP_ID>/hosting/`)

```json
{
    "FB_appId":"<YOUR APP ID HERE>",
    "FB_uploadAccessToken": "<YOUR ACCESS TOKEN HERE>"
}
```

## Option 1: Running locally against a mocked version of the SDK
You can test your build against a local mock of the FBInstant SDK by running
```
$ yarn mock
```
This should open the browser and run your index.html in the root of your project. The local webserver will be configured with a live reload feature. You can use this mode to make quick iterations on your game that don't depend on real-life SDK responses. All responses from the FBInstant SDK will return dummy values. You can find the mocked SDK in the `./js/mock` folder.


## Option 2: Running locally against the live SDK
If you want to test your build against the live SDK, you can do so by running the command:
```
$ yarn test
```
This will copy all the relevant files to the `./build` folder and run a local webserver from there. It will then point your browser to **embedded player** testing environment: `https://www.facebook.com/embed/instantgames/<YOUR_GAME_ID>/player?game_url=https://localhost:8000`. ([More information on the embedded player testing environment](https://developers.facebook.com/docs/games/instant-games/test-publish-share))

This is as close as it gets to the real-life execution in a desktop browser. You should use this mode when you're making modifications that depend on real information being returned by the SDK.

> **Note that the webserver will run with HTTPS, so the first time you execute on this mode, you might need to go to `https://localhost:8000`  and approve the certificates with your browser**



## Option 3: Running on Messenger on your mobile device

### Step 1. Package and zip
Provided that you have declared all the information in the **Configuration** section above, you can zip and upload your build by running:
```
$ yarn push
```
This will copy all the relevant files to the `./build` folder, create a .ZIP archive on the `./build/archives` folder and upload it to your app's Web Hosting.

### Step 2. Push your build to production
Once the task above completes it will open your app's web hosting page, so that you can push the new build live ([more information on pushing builds live](https://developers.facebook.com/docs/games/instant-games/test-publish-share)).

![publish build][publish]

### Step 3. Test your game on Messenger
Once there's a build in **Production** you can open Messenger on your mobile device and your game will be there in the games list, under a section called "In Development".

![play on messenger][play]


[publish]:https://scontent.xx.fbcdn.net/v/t39.2365-6/16686534_113502745838345_8364033545752018944_n.png?_nc_log=1&oh=9662357cdd2006640d17e87395046fee&oe=5B0E27F4
[play]: https://scontent.xx.fbcdn.net/v/t39.2365-6/16781486_703189003194389_5634483315479150592_n.png?_nc_log=1&oh=77924ae0f69f16375ff834ce2d0848c1&oe=5B49D4B3
