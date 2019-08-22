## Bugs
- Contract analysis fails immediately on a contract with no defined states

## Possible improvements
- Zubair proposed moving from geth to ganache so that contract testing will not take as long as it currently does.
- The setup process and usage of the gas analyser must be simplified

## Versions of dependencies used
- solc 0.4.24
- web3 0.20.1
- geth 1.8.27

# Installation guide
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

# Contract Analyser Usage
Ensure you have graphviz installed (on macOS `brew install graphviz`).
Open a Flint contract which has some states declared in it. Right-click on any location on the page and open the `Command Palette`. From there, you can run `Contract Insights: Analyse`.

# Gas analyser setup
Then, run the following commands to get the scripts used to run a local testing blockchain on your machine.
In a folder of your choice, run
```bash
git clone http://www.github.com/flintlang/Flint-Block.git
cd Flint-Block
```
Download version 1.8.27 of `geth` inside the current folder as follows:
### If using macOS
```bash
wget -c https://gethstore.blob.core.windows.net/builds/geth-darwin-amd64-1.8.27-4bcc0a37.tar.gz -O - | tar -xz
mv geth-darwin-amd64-1.8.27-4bcc0a37/geth .
rm -rf geth-darwin-amd64-1.8.27-4bcc0a37
```
### If using Linux
```bash
wget -c https://gethstore.blob.core.windows.net/builds/geth-linux-amd64-1.8.27-4bcc0a37.tar.gz-O - | tar -xz
mv geth-linux-amd64-1.8.27-4bcc0a37/geth .
rm -rf geth-linux-amd64-1.8.27-4bcc0a37
```

Then, from the same directory, create a new geth account using an empty password, i.e. press Enter on your keyboard when asked for one:
```bash
geth --datadir ./blockchain account new
```
[Note: we are very aware that the following is terribile practise and we intend to replace it with a proper config file]

Replace the account address (under `alloc`) in `genesis.json` with the new one that you have generated locally.

In flint's installation directory, do the same for the Javscript constant `defaultAcc` in `Sources/ContractAnalysis/GasEstimator.swift` and recompile with `make`.

Again from `Flint-Block`'s directory run the following
```bash
make init
make runH
```
And from a new terminal window, also inside `Flint-Block`'s folder, run
```bash
make attachH
> miner.start()
```
Wait some time for the first terminal window to finish `generating DAG`

## Gas analyser usage
Open a Flint contract. Right-click on any location on the page and open the `Command Palette`. From there, you can run `Contract Insights: Estimate Gas`. Wait some time.

When you are done with doing gas analysis you can stop the mining process from within the previous terminal window with the command `miner.stop()`



