## Known Bugs
- Contract analysis fails immediately on a contract with no defined states
- If contract cost exceeds allowances no information is sent to vscode when performing gas analysis (see examples/valid/MajorityWithdraw)

## Possible improvements
- Zubair proposed moving from geth to ganache so that contract testing will not take as long as it currently does.
- The setup process and usage of the gas analyser must be simplified

## Versions of dependencies used
These should get installed automatically if you follow the guide
- solc 0.4.25
- web3 0.20.7
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

From within your flint installation folder (`~/.flit`) run 
``` bash
npm install
```

# Contract Analyser Usage
Ensure you have graphviz installed (on macOS `brew install graphviz`).
Open a Flint contract which has some states declared in it. Right-click on any location on the page and open the `Command Palette`. From there, you can run `Contract Insights: Analyse`.

# Local blockchain setup
## Having a local blockchain running in the background is required by the Gas analyser, the REPL and the Testing framework

Run the following commands to get the scripts used to run the local testing blockchain on your machine.
From within your home folder (~), run
```bash
git clone http://www.github.com/flintlang/Flint-Block.git .flint-block
cd .flint-block
make geth
```

Then, from the `~/.flint-block` directory, create a new geth account using an empty password, i.e. press Enter when asked for one:
```bash
./geth --datadir ./blockchain account new
```
Copy and paste your ethereum account number in flint's configuration file found at `~/.flint/flint_config.json`, within the ethereumAddress field.

Again from `~/.flint-block`'s directory run
```bash
make init
```
This should automatically load some Weis on your account's balance so you can use the ecosystem.


# Local blockchain usage
The following assumes that your working directory is  `~/.flint-block`.

To start the blockchain run
```bash
make runH
```
and, from a new terminal window,
```bash
make scriptH
```
From here you should be able to check the balance of your ethereum address by typing `eth.getBalance(eth.accounts[0])`. Mining should work automatically but if you are having issues with the blockchain based tools you might try forcing the mining process by running `miner.start()`.

If you run out of money, you should reset your blockchain by running
```bash
make clean
```
and redo the local blockchain setup process, starting by creating a new account.

# Gas analyser usage (requires running blockchain)

Open a Flint contract. Right-click on any location on the page and open the `Command Palette`. From there, you can run `Contract Insights: Estimate Gas`. Wait some time.


# Testing framework usage (requires running blockchain)
Create a `.tflint` test file to test some `.flint` contract you have written following the instrutions provided in this paper https://github.com/flintlang/flint/blob/master/docs/pdfs%20(student%20theses)/ecosystem/MohammadChowdhury.pdf. Run `flint-test` on that file while the blockchain is running.

# REPL Usage (requires running blockchain)
Just run `flint-repl SomeContract.flint`. From the repl you should be able to deploy and interact with the contract in a similar manner as that of the `.tflint` files which you can inspect at `~/.flint/examples/testing_framework`.