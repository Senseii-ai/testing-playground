# Sample script for function calling using OpenAI assistant API and Node JS

You will need OpenAI api Key to run this script.

## Steps to run the script

### Clone the Repository
you can use http or ssh to clone the repository

### Install node_modules
```bash
npm install
or
yarn
```

### Create .env file
```bash
touch .env
```

### Write the following into the env file
```
OPENAI_API_KEY=<OpenAI API Key>
ASSISTANT_ID=<ASSISTANT ID>
THREAD_ID=<THREAD_ID>
```

> To generate assistant and thread ids, you can use the Assistant API dashboard on OpenAI official API, or use the `newThread` and `newAssistant` funcitons by calling them in the main function.

### Starting the script with nodemon
```bash
npm run dev
or
yarn dev
```

If facing any issues, please raise in the issues section.