## Bugs
- Contract analysis fails immediately on a contract with no defined states

## Possible improvements
- Zubair proposed moving from geth to ganache so that contract testing will not take as long as it currently does.

## Installation guide
Ensure that you have the latest version of VSCode installed.
From within your vscode extensions' directory, usually `~/.vscode/extensions`, run the following
```bash
git clone www.github.com/flintlang/Flint-Colour.git # Syntax highlighting
git clone www.github.com/flintlang/Flint-Language-Server.git
cd Flint-Langugage-Server
npm install
npm run compile
```
In VSCode, set the location of your flint installation directory under File > Preferences > Settings > Extension > Flint Language Server

From within your flint installation folder (FLINTPATH) run 
``` bash
npm install
```

## Contract Analyser Usage
Open a Flint contract which has some states declared in it. Right-click on any location on the page and open the `Command Palette`. From there, you can run `Contract Insights: Analyse`.

## Gas analyser setup
Ensure you have installed geth, on macOS run from a terminal window `brew install geth`.
Then, run the following commands to get the scripts used to run a local testing blockchain on your machine.
In a folder of your choice, run
```bash
git clone http://www.github.com/flintlang/Flint-Block.git
cd Flint-Block
make init
```
Then, create a new geth account as follows
```bash
geth account new
```
Use an empty password, i.e. press Enter on your keyboard when asked for one.
Then, replace the account number in `genesis.json` with the new one that you have generated locally.
## Gas analyser usage
