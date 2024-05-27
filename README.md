# doclog

## to run locally:

### Initial local environment setup:

**important** -> start from the root directory of the project

1. make an env file using the example for the react app
```
cp .env.example .env
```

2. install packages for the react app
```
npm install
```

3. make an env file using the example for the node server and fill in your turso url and auth token
```
cd node-server
cp .env.example .env
```

4. install packages for the node server
```
npm install
```

5. go back to the root directory
```
cd ..
```

### start local dev server:
1. First in one terminal:
```
npm run dev
```

2. Then in another terminal:
```
npm run dev:node
```

If you want to test the node server's static routes that serve the production react app, you will need to build the react app first:
```
npm run build
```

## to deploy to koyeb

coming soon...but everything is already configured to do so

