# StuckWanYah

## My version of Facemash.
Let's get down to the history. What is Facemash? [Facemash](http://en.wikipedia.org/wiki/Facemash) was a website that put two random pictures of people together and let you voted for who's hotter based on their looks. Initially created by Facebook founder, Mark Zuckerberg for rating girls at Harvard University. The whole site was set up in one night and received huge traffic which led to 22000 hits and eventually crashed the Howard network.
a Howard version of hotornot.com website created by [Mark Zuckerberg](http://en.wikipedia.org/wiki/Mark_Zuckerberg) for rating Howard students based on their looks back in 2003. The entire website was set up in one night, a span of eight hours near midnight to be specific. By morning, the site had accumulated a total of 22,000 hits which led to his suspension over violation of copyright, privacy, and breaching of Howard network security. The photos were programmatically scraped from the online facebooks of the nine houses at Harvard, starting with the Kirkland house. The site was later permanently taken down over the weekend.

	According to The Harvard Crimson, Facemash "used photos compiled from the online facebooks of nine Houses, placing two next to each other at a time and asking users to choose the 'hotter' person".

**StuckWanYah** is a PNG revamp version of Facemash. Unlike Facemash, StuckWanYah lets user vote his/her Facebook friends based on their hotness ("Stuckwanness"). The user login with Facebook and all his/her friends are retrieved from Facebook and stored on StuckWanYah's own database. Later two friends are randomly picked and the photos are put up next to each other letting user vote which one is hotter ("Stuck wan"). User has the option to be voted and not to be voted, he/she can block his/her own photo if he/she does not want to play the game.

## What is StuckWanYah?
StuckWanYah is a pun for stak wan, Stak Wan Yah or Stuck Wan. It has subtle meanings. It is used explicitly as an adjectival to refer to a person's looks.

We all know what it means in the context of our daily conversations, but I'm just gonna sum it up for you. 
"Stak wan yah" or "stak wan" in tok pisin is a pun that has subtle meanings. 
It is not known exactly when it was first coined up but was first used in the song "Narawan"; 
a 2016 single released from a collaboration between PNG's well-known artists 5-STAR, Jaro Local and Dr Doxx. From the hit-song the meaning of the term refers to someone that has major effect on your life say you are fatuated with them. It's stuck on your mind.

### In dept know about & Technologies stack used
StuckWanYah started out as a learning experiment with the NodeJs, MongoDB, JavaScript and AJAX technologies and later extend to Facebook Platform with the idea of manipulating Facebook user data. Also the project is for experimenting on algorithm implementation and data structure.

Unlike Facemash which was built on LAMP stack, StuckWanYah is built on the creator's taste of technology stack in other words it is built on mix technology. NodeJs runs the server, serving the database while rendering EJS in HTML which serves the client. StuckWanYah also makes use of Facebook Messenger Bot API. User sends a text message via StuckWanYah Facebook Page and receieves response from server. StuckWanYah also uses Facebook Login for keeping stateless persistant login of user using cookies and sessions.

StuckWanYah uses the [Elo Rating System](https://en.wikipedia.org/wiki/Elo_rating_system), to compute relative value of comparison. The system is used by large organisations to rank players of two-player game.

### Contribute
Show your support by 🌟 the project!!

Feel free to contribute!!

### License
This project is released under [MIT License](https://opensource.org/licenses/MIT)(LICENSE.txt).
