[![Build & deploy](https://github.com/ndanhkhoi/ndanhkhoi.github.io/actions/workflows/build-deploy.yml/badge.svg)](https://github.com/ndanhkhoi/ndanhkhoi.github.io/actions/workflows/build-deploy.yml)
[![Code Grade](https://api.codiga.io/project/32162/status/svg)](https://app.codiga.io/project/32162/dashboardd)
[![Code Quality Score](https://api.codiga.io/project/32162/score/svg)](https://app.codiga.io/project/32162/dashboard)

# Personal Resume

- This project was bootstrapped with Create React App.
- This project uses [DevResume-Theme](https://github.com/xriley/DevResume-Theme) as a template.

>DevResume is a free Bootstrap 5 resume/CV template I made for software developers. Built on Bootstrap 5 and SASS, it's quick and easy to change the template styling. This template is designed to help you build your personal brand and attract better clients!

## Build own Resume
- Clone this project
- Resume data store in ```data.ts```. You can modify this data to make your resume easily.
- Modify your homepage in ```package.json```. It should be https://{your_username}.github.io/{your_repository}. If you want your homepage simply https://{your_username}.github.io, you just named your project is {your_username}.github.io
- Added Actions secrets with key is USER, value is your github username. [Learn more about Action Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- Finally, commit and push to your main branch. Wait some minute, if anything ok, your resume should be deploy at the homepage that you put into ```package.json```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

## Visit my resume at
https://ndanhkhoi.github.io/