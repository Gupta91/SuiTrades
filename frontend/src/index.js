import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
 
// use getFullnodeUrl to define Devnet RPC location
const rpcUrl = getFullnodeUrl('devnet');
 
// create a client connected to devnet
const client = new SuiClient({ url: rpcUrl });
 
// get coins owned by an address
// replace <OWNER_ADDRESS> with actual address in the form of 0x123...
await client.getCoins({
	owner: '0xa8837b2c7e9925012c677622351dacf9ac59a151699ca89195febdd5347aaa7a',
});