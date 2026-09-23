const json = (data, status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export default {
 async fetch(request, env) {
  const url=new URL(request.url);
  if(url.pathname==='/api/interest') {
   if(request.method!=='POST') return json({error:'Method not allowed'},405);
   if(request.headers.get('Origin')!==url.origin) return json({error:'Please submit from this website.'},403);
   if(!request.headers.get('Content-Type')?.includes('application/json')) return json({error:'Invalid request.'},415);
   try {
    const raw=await request.text(); if(raw.length>4096) return json({error:'Please shorten your response.'},413);
    const data=JSON.parse(raw);
    if(data.website) return json({ok:true});
    const clean=(key,max)=>typeof data[key]==='string'?data[key].trim().slice(0,max):'';
    const email=clean('email',254).toLowerCase(),name=clean('name',100),restaurant=clean('restaurant',150),city=clean('city',100);
    if(!name||!restaurant||!city||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||data.consent!==true) return json({error:'Please complete the required fields and consent checkbox.'},400);
    const number=(value,max)=>value===''||value==null?null:(Number.isInteger(Number(value))&&Number(value)>0&&Number(value)<=max?Number(value):NaN);
    const quantity=number(data.quantity,10000),price=number(data.price,100000);
    if(Number.isNaN(quantity)||Number.isNaN(price)) return json({error:'Please enter a valid whole-number quantity or price.'},400);
    const finishes=data.finishes??[];
    if(!Array.isArray(finishes)||finishes.length>4||finishes.some(f=>!['Matte Black','Gloss Black','White','Polished Nickel'].includes(f))) return json({error:'Please select a listed finish.'},400);
    await env.DB.prepare('INSERT INTO interests (id,email,name,restaurant,city,quantity,price_usd,created_at,finishes) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(email) DO NOTHING').bind(crypto.randomUUID(),email,name,restaurant,city,quantity,price,new Date().toISOString(),JSON.stringify([...new Set(finishes)])).run();
    if(env.RESEND_API_KEY) {
     try {
     const notification=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({
       from:'Tablesiide <support@tablesiide.com>',
       to:['support@tablesiide.com'],
       reply_to:email,
       subject:'New Tablesiide restaurant inquiry',
       text:[`Name: ${name}`,`Email: ${email}`,`Restaurant: ${restaurant}`,`City: ${city}`,`Quantity: ${quantity??'Not provided'}`,`Suggested price (USD): ${price??'Not provided'}`,`Finishes: ${[...new Set(finishes)].join(', ')||'Not provided'}`].join('\n')
      })
     });
     if(!notification.ok) throw Error(`Mail provider returned ${notification.status}`);
     } catch(error) {
      console.error('Inquiry notification failed',error);
      return json({error:'Your interest was saved, but we could not notify the team. Please try again shortly.'},503);
     }
    }
    return json({ok:true});
   } catch {return json({error:'We could not save your interest. Please try again shortly.'},500);}
  }
  if(request.method!=='GET'&&request.method!=='HEAD') return new Response('Method not allowed',{status:405});
  const asset=ASSET_MAP[url.pathname==='/'?'/index.html':url.pathname];
  if(!asset) return new Response('Not found',{status:404});
  const bytes=Uint8Array.from(atob(asset.body),c=>c.charCodeAt(0));
  return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=60'}});
 }
};
