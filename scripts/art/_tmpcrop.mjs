import sharp from 'sharp';
const [src,out,x,y,w,h,polys] = process.argv.slice(2);
const P = JSON.parse(polys||'[]');
const m = await sharp(src).metadata();
const svg = `<svg width="${m.width}" height="${m.height}" xmlns="http://www.w3.org/2000/svg">${P.map(p=>`<polygon points="${p.map(([a,b])=>`${a},${b}`).join(' ')}" fill="none" stroke="red" stroke-width="1"/>`).join('')}</svg>`;
const full = await sharp(src).composite([{input:Buffer.from(svg)}]).png().toBuffer();
await sharp(await sharp(full).extract({left:+x,top:+y,width:+w,height:+h}).png().toBuffer()).resize(+w*2).png().toFile(out);
