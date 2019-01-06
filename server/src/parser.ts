function parse(tokens: String[]) 
{
	let sync_set: Set<String> = new Set(["{", ":"]);
	consume(tokens, sync_set, "contract");
	consume(tokens, sync_set, "cou2");
	consume(tokens, sync_set, "{");
	consume(tokens, sync_set, "var");
	consume(tokens, sync_set, "x2");
	consume(tokens, sync_set, ":");
	consume(tokens, sync_set, "Int");
	consume(tokens, sync_set, "=");
	consume(tokens, sync_set, "0");

	console.log(tokens);
}

function consume(input_tokens: String[], sync_set: Set<String>, token_consume: String): String[]
{
	let first : String = input_tokens[0];
	if (first === token_consume)
	{
		//remove token	
		let index_of_first: number = input_tokens.indexOf(first);
		input_tokens.splice(index_of_first, 1);
		return input_tokens;
	} else {
		//initate error recovery mechanism
		sync_parser(input_tokens, sync_set);
	}
	return input_tokens;
}

function sync_parser(input_tokens: String[], sync_set: Set<String>)
{
	var sync : Boolean = false;
	while (!sync)
	{
		if (input_tokens.length <= 0)
		{
			return;
		}

		let tok = input_tokens[0];
		if (sync_set.has(tok)) {
			sync = true;
			continue;
		} 

		input_tokens.splice(0, 1);
	}

}


parse(["contract", "counter", "{", "var", "x", ":", "Int", "=", "0"]);
