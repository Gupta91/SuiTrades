import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
 
const client = new SuiClient({ url: getFullnodeUrl('devnet') });

export default client;