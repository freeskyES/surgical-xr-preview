const imageDialog=document.querySelector('.image-dialog');
document.querySelector('.dialog-close').addEventListener('click',()=>imageDialog.close());
for(const dialog of [imageDialog])dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
document.querySelectorAll('[data-image-open]').forEach(link=>link.addEventListener('click',event=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();const img=imageDialog.querySelector('img');img.src=link.href;img.alt=link.querySelector('img').alt;imageDialog.querySelector('p').textContent=img.alt;imageDialog.showModal();}));
const links=[...document.querySelectorAll('.section-nav-items a')];
const sections=links.map(a=>document.getElementById(a.hash.slice(1)));
let pending=false;
function update(){pending=false;const line=document.querySelector('.section-nav').getBoundingClientRect().height+100;let current=sections[0];for(const section of sections){if(section.getBoundingClientRect().top<=line)current=section;}links.forEach(a=>{if(a.hash===`#${current.id}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
function schedule(){if(!pending){pending=true;requestAnimationFrame(update);}}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);addEventListener('hashchange',schedule);document.addEventListener('load',schedule,true);
links.forEach(link=>link.addEventListener('click',()=>{const target=document.getElementById(link.hash.slice(1));target.tabIndex=-1;target.focus({preventScroll:true});}));
update();
