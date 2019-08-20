## Bugs
1. Contract analysis fails immediately on a contract with no defined states

## Installation guide
Ensure that you have the latest version of VSCode installed.
From within your vscode extensions' directory, usually `~/.vscode/extensions`, run the following
```bash
git clone www.github.com/flintlang/Flint-Colour # Syntax highlighting
git clone www.github.com/flintlang/Flint-Language-Server
cd Flint-Langugage-Server
npm install
npm run compile
```
In VSCode, set the location of your flint installation directory under File > Preferences > Settings > Extension > Flint Language Server

## Contract Analyser Usage
Open a Flint contract which has some states declared. Right-click on any location on the page and open the `Command Palette`. From there, you can run `Contract Insights: Analyse`.

## Gas analyser usage
