# Tech Haven Website

Repository for https://thetechhaven.com. Website is built using the MERN stack. Feel free to use as an example for your own website, or implimenting Discord Oauth.

### Enviromental Variables

- **Development**: Change the `.env.example` file to `.env` and fill in the envriomental variables
- **Production**: Install pm2 globally `npm i pm2 -g`, change the `ecosystem.config.js.example` file to `ecosystem.config.js` and fill in the enviromental variables
- **Docker**: Use an .env file with docker-compose. Docker setup coming soon...

  | ENV            | Example                                       |
  | -------------- | --------------------------------------------- |
  | NODE_ENV       | development or production                     |
  | PORT           | 5000                                          |
  | SESSION_SECRET | [some random string]                          |
  | MONGO_URI      | mongodb://localhost:27017/example             |
  | REDIRECT_URI   | http://thetechhaven.com/api/discord/oauth     |
  | DASHBOARD_URI  | http://thetechhaven.com/dashboard             |
  | SCOPE          | 'identify'                                    |
  | CLIENT_ID      | [CLIENT_ID from Discord Developer Portal]     |
  | CLIENT_SECRET  | [CLIENT_SECRET from Discord Developer Portal] |

### Installation

Install the dependencies and devDependencies and start the server.

```sh
$ cd thetechhaven.com
$ npm install -d
$ node app
```

For production environments...

```sh
$ npm install --production
```

### Docker

Docker deployment instructions coming soon...

### Todos

- Add openvpn client API so users can request access to the Tech Haven lab.
- Add Docker or KVM API for various linux distro to try in a container or VM.
- Add CTF challenges to dashboard
- Add admin portal to approve openvpn client requests
