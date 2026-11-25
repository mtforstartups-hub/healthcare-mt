import {env} from './runtime';
import {pages} from './content';
import {cmsEntries,publicEntries} from './cms';
import {topicIndex} from './editorial';
import tools from '../content/tools.json';
import {integrationConfig,isPrivatePath} from './integration-policy';

export const integrations=integrationConfig(env);
export async function analyticsPublicPaths(){
 const paths=[...pages.filter(p=>!['utility','legal'].includes(p.type)).map(p=>p.path),
 ...(await publicEntries(cmsEntries)).map(p=>p.path),
 ...topicIndex.map(t=>'/blog/topics/'+t.slug),...tools.map(t=>'/resources/'+t.slug),'/guides','/answers'];
 return [...new Set(paths)].filter(p=>!isPrivatePath(p));
}
