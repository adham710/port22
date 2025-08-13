// Femme — Multi-page Arabic RTL Fashion Store (Vanilla JS)
const $$ = (sel, el=document) => el.querySelector(sel);
const $$$ = (sel, el=document) => [...el.querySelectorAll(sel)];
const $id = (id)=> document.getElementById(id);
const CFG = window.FEMME_CONFIG || {};

const state = {
  products: [],
  filtered: [],
  cart: JSON.parse(localStorage.getItem('cart')||'[]'),
  wishlist: JSON.parse(localStorage.getItem('wishlist')||'[]'),
  page: 1, perPage: 8,
  cat: '', size: '', priceMin: '', priceMax: '', sort: 'pop', q: ''
};

const categories = ['فساتين','تيشيرتات','بلايز','بناطيل','تنورات','أطقم','ملابس رياضية'];
const sizes = ['XS','S','M','L','XL'];

function seed(){
  // try to load from localStorage first
  const saved = localStorage.getItem('products');
  if(saved) try { return JSON.parse(saved); } catch(e){}
  const prods = [];
  const basePrice = [699, 899, 1099, 1299, 1499, 1699];
  for(let i=1;i<=24;i++){
    const cat = categories[i % categories.length];
    const price = basePrice[i % basePrice.length] + (i%3)*50;
    const sale = i % 4 === 0 ? Math.round(price * 0.8) : null;
    prods.push({
      id: i,
      title: `${cat} أنيقة ${i}`,
      sku: `FM-${1000+i}`,
      cat, sizes: sizes.slice(0, 3 + (i%3)),
      price, sale, rating: (3 + (i%3) + Math.random()).toFixed(1),
      img: `images/prod${(i%12)+1}.svg`,
      createdAt: Date.now() - (24-i)*86400000,
      desc: 'خامة مريحة وجودة عالية بتفاصيل عصرية تناسب الخروجات والمناسبات.'
    });
  }
  return prods;
}
function saveProducts(){ localStorage.setItem('products', JSON.stringify(state.products)); }

function money(v){ return new Intl.NumberFormat('ar-EG', {style:'currency', currency:'EGP'}).format(v); }
function saveCart(){ localStorage.setItem('cart', JSON.stringify(state.cart)); }
function saveWish(){ localStorage.setItem('wishlist', JSON.stringify(state.wishlist)); }
function setCounts(){
  const cc = $id('cartCount'); if(cc) cc.textContent = state.cart.reduce((s,i)=>s+i.qty,0);
  const wc = $id('wishCount'); if(wc) wc.textContent = state.wishlist.length;
}

function renderCats(){
  const el = $id('cats'); if(!el) return;
  el.innerHTML='';
  const make = (label, active)=>{
    const b = document.createElement('button'); b.className='chip'+(active?' active':'');
    b.textContent=label; return b;
  }
  const all = make('الكل', !state.cat);
  all.onclick = ()=>{ state.cat=''; apply(); };
  el.appendChild(all);
  categories.forEach(c=>{
    const b = make(c, state.cat===c);
    b.onclick=()=>{ state.cat = state.cat===c ? '' : c; apply(); };
    el.appendChild(b);
  });
}

function apply(){
  const q = state.q.trim();
  state.filtered = state.products.filter(p=> 
    (!state.cat || p.cat===state.cat) &&
    (!state.size || p.sizes.includes(state.size)) &&
    (!state.priceMin || (p.sale??p.price) >= +state.priceMin) &&
    (!state.priceMax || (p.sale??p.price) <= +state.priceMax) &&
    (!q || p.title.includes(q))
  );
  const pageType = document.body.dataset.page;
  if(pageType==='new'){
    state.filtered.sort((a,b)=> b.createdAt - a.createdAt);
  } else if(pageType==='sale'){
    state.filtered = state.filtered.filter(p=> p.sale);
    state.filtered.sort((a,b)=> ((b.price - (b.sale??b.price)) - (a.price - (a.sale??a.price))));
  } else {
    switch(state.sort){
      case 'new': state.filtered.sort((a,b)=>b.id-a.id); break;
      case 'low': state.filtered.sort((a,b)=> (a.sale??a.price) - (b.sale??b.price)); break;
      case 'high': state.filtered.sort((a,b)=> (b.sale??b.price) - (a.sale??a.price)); break;
      default: state.filtered.sort((a,b)=> b.rating - a.rating);
    }
  }
  state.page = 1; renderGrid();
}

function card(p){
  const el = document.createElement('article'); el.className='card';
  el.innerHTML = `
    <div class="img"><img src="${p.img}" alt="${p.title}"></div>
    <button class="icon-btn fav" aria-label="مفضلة"><span class="i i-heart"></span></button>
    ${p.sale?'<span class="badge abs">خصم</span>':''}
    <div class="body">
      <h3>${p.title}</h3>
      <div class="muted">${p.cat} • تقييم ${p.rating}</div>
      <div class="price-row"><span class="price">${money(p.sale??p.price)}</span> ${p.sale?`<span class="old">${money(p.price)}</span>`:''}</div>
      <div class="actions">
        <button class="btn primary">أضيفي للسلة</button>
        <button class="btn">عرض سريع</button>
      </div>
    </div>`;
  const [addBtn, quickBtn] = $$$('.btn', el);
  const favBtn = $$('.fav', el);
  addBtn.onclick = ()=> openModal(p);
  quickBtn.onclick = ()=> openModal(p);
  favBtn.onclick = ()=> toggleWish(p.id, favBtn);
  return el;
}

function renderGrid(){
  const grid = $id('grid'); if(!grid) return;
  grid.innerHTML='';
  const start = (state.page-1)*state.perPage;
  const items = state.filtered.slice(start, start+state.perPage);
  items.forEach(p=> grid.appendChild(card(p)));
  renderPager();
}

function renderPager(){
  const pager = $id('pager'); if(!pager) return;
  const total = Math.ceil(state.filtered.length / state.perPage);
  pager.innerHTML='';
  if(total<=1){ return; }
  for(let i=1;i<=total;i++){
    const b = document.createElement('button'); b.className = 'chip'+(i===state.page?' active':'');
    b.textContent = i; b.onclick = ()=>{ state.page=i; renderGrid(); window.scrollTo({top:0, behavior:'smooth'}); };
    pager.appendChild(b);
  }
}

function openModal(p){
  const modal = $$('.modal'); if(!modal) return;
  $id('pmTitle').textContent = p.title;
  $id('pmSku').textContent = 'كود المنتج: '+p.sku;
  $id('pmImg').src = p.img;
  $id('pmPrice').textContent = money(p.sale??p.price);
  $id('pmOld').textContent = p.sale? money(p.price): '';
  $id('pmSale').style.display = p.sale? 'inline-flex':'none';

  const sizesWrap = $id('pmSizes'); sizesWrap.innerHTML='';
  p.sizes.forEach(s=>{
    const b = document.createElement('button'); b.className='size'; b.textContent=s;
    b.onclick = ()=> $$$('.size', sizesWrap).forEach(x=>x.classList.toggle('active', x===b));
    sizesWrap.appendChild(b);
  });
  $id('pmQty').value = 1;
  $id('pmDesc').textContent = p.desc;
  $id('pmAdd').onclick = ()=>{
    const sBtn = $$('.size.active', sizesWrap);
    const size = sBtn? sBtn.textContent : p.sizes[0];
    addToCart(p, size, +$id('pmQty').value||1);
    closeModal();
  };
  $id('pmWish').onclick = ()=> toggleWish(p.id);
  $$('.modal').classList.add('show');
}
function closeModal(){ const m = $$('.modal'); if(m) m.classList.remove('show'); }
document.addEventListener('click', e=>{ if(e.target.classList && e.target.classList.contains('modal')) closeModal(); });
window.addEventListener('DOMContentLoaded', ()=>{ const pmc=$id('pmClose'); if(pmc) pmc.onclick=closeModal; });

function toggleWish(id, btn){
  const i = state.wishlist.indexOf(id);
  if(i>-1) state.wishlist.splice(i,1); else state.wishlist.push(id);
  saveWish(); setCounts();
  if(btn) btn.classList.toggle('active');
}

function addToCart(p, size, qty){
  const key = `${p.id}-${size}`;
  const exist = state.cart.find(i=> i.key===key);
  if(exist) exist.qty += qty;
  else state.cart.push({key, id:p.id, title:p.title, price:p.sale??p.price, size, qty, img:p.img});
  saveCart(); setCounts(); location.href = 'cart.html';
}

// CART PAGE
function renderCart(){
  const wrap = $id('cartView'); if(!wrap) return;
  const items = state.cart;
  if(!items.length){ wrap.innerHTML = '<div class="card" style="padding:20px">السلة فارغة. <a href="shop.html" class="btn" style="margin-top:10px;display:inline-block">عودي للتسوق</a></div>'; return; }
  const rows = items.map((i,idx)=>`
    <div class="card" style="display:grid;grid-template-columns:120px 1fr auto;gap:12px;padding:12px;align-items:center">
      <img src="${i.img}" alt="${i.title}" style="height:120px;object-fit:cover;border-radius:12px">
      <div>
        <h3>${i.title}</h3>
        <div class="muted">المقاس: ${i.size}</div>
        <div class="price-row"><span class="price">${money(i.price)}</span></div>
        <div class="muted">الكمية: <input type="number" min="1" value="${i.qty}" data-idx="${idx}" class="qtyField" style="width:80px"> </div>
      </div>
      <button class="icon-btn delBtn" data-idx="${idx}" title="حذف"><span class="i i-x"></span></button>
    </div>
  `).join('');
  const total = items.reduce((s,i)=> s + i.price*i.qty, 0);
  wrap.innerHTML = `
    <h2>سلة التسوق</h2>
    <div style="display:grid;gap:12px;margin:12px 0">${rows}</div>
    <div class="card" style="padding:16px;display:flex;justify-content:space-between;align-items:center">
      <strong>الإجمالي: ${money(total)}</strong>
      <a href="checkout.html" class="btn primary">إتمام الشراء</a>
    </div>
  `;
  $$$('.qtyField', wrap).forEach(inp=> inp.addEventListener('input', e=>{
    const idx = +e.target.dataset.idx; state.cart[idx].qty = Math.max(1, +e.target.value||1); saveCart(); setCounts(); renderCart();
  }));
  $$$('.delBtn', wrap).forEach(btn=> btn.onclick = ()=>{
    const idx = +btn.dataset.idx; state.cart.splice(idx,1); saveCart(); setCounts(); renderCart();
  });
}

// CHECKOUT PAGE
function renderCheckout(){
  const wrap = $id('checkoutView'); if(!wrap) return;
  const total = state.cart.reduce((s,i)=> s + i.price*i.qty, 0);
  wrap.innerHTML = `
    <h2>الدفع والشحن</h2>
    <form id="coForm" class="card" style="padding:16px;display:grid;gap:12px">
      <div style="display:grid;gap:12px;grid-template-columns:1fr 1fr">
        <label>الاسم الكامل<input required id="coName"></label>
        <label>الهاتف<input required id="coPhone"></label>
        <label style="grid-column:1 / -1">العنوان<input required id="coAddr"></label>
        <label>المدينة<input required id="coCity"></label>
        <label>المحافظة<input required id="coState"></label>
      </div>
      <details class="details"><summary>ملخص الطلب</summary>
        ${state.cart.map(i=> `<div>${i.title} × ${i.qty} — ${money(i.price*i.qty)}</div>`).join('')}
        <div style="margin-top:6px"><strong>الإجمالي: ${money(total)}</strong></div>
      </details>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" id="payOnline">الدفع أونلاين</button>
        <button class="btn" id="payCOD" type="button">الدفع عند الاستلام</button>
      </div>
    </form>
  `;
  $id('coForm').addEventListener('submit', e=> e.preventDefault());
  $id('payCOD').onclick = ()=>{
    alert('تم استلام طلبك للدفع عند الاستلام! سيتم التواصل معك للتأكيد.');
    state.cart = []; saveCart(); setCounts(); location.href = 'index.html';
  };
  $id('payOnline').onclick = (e)=>{
    e.preventDefault();
    if(CFG.PAYMENT_LINK){
      // Redirect to Stripe Payment Link (set in config.js)
      window.location.href = CFG.PAYMENT_LINK;
    } else {
      alert('ضعي رابط دفع Stripe Payment Link في ملف config.js ليعمل الدفع الأونلاين. تم استخدام الدفع عند الاستلام مؤقتًا.');
    }
  };
}

// WISHLIST PAGE
function renderWishlist(){
  const wrap = $id('wishWrap'); if(!wrap) return;
  wrap.innerHTML = '';
  const items = state.products.filter(p=> state.wishlist.includes(p.id));
  if(!items.length){ wrap.innerHTML='<div class="card" style="padding:16px">لا توجد عناصر في المفضلة بعد.</div>'; return; }
  items.forEach(p=> wrap.appendChild(card(p)));
}

// CONTACT FORM
document.addEventListener('DOMContentLoaded', ()=>{
  const cf = $id('contactForm');
  if(cf){ cf.addEventListener('submit', (e)=>{
    e.preventDefault();
    alert('تم استلام رسالتك. سنرد قريبًا.');
    $id('cName').value=''; $id('cEmail').value=''; $id('cMsg').value='';
  });}
});

// Drawer & theme & newsletter
function bindChrome(){
  const drawer = $id('drawer'), overlay = $id('overlay');
  const menuBtn = $id('menuBtn'), drawerClose = $id('drawerClose');
  if(menuBtn) menuBtn.onclick = ()=>{ drawer.classList.add('show'); overlay.classList.add('show'); };
  if(drawerClose) drawerClose.onclick = closeDrawer;
  if(overlay) overlay.onclick = closeDrawer;
  function closeDrawer(){ drawer.classList.remove('show'); overlay.classList.remove('show'); }

  const themeToggle = $id('themeToggle');
  if(themeToggle){ themeToggle.onclick = ()=>{
    const body = document.body;
    body.classList.toggle('theme-light');
    body.classList.toggle('theme-dark');
    localStorage.setItem('theme', body.classList.contains('theme-dark') ? 'dark' : 'light');
  };}

  const nf = $id('newsletterForm');
  if(nf){ nf.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = $id('newsletterEmail').value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ alert('الرجاء إدخال بريد صالح'); return; }
    localStorage.setItem('newsletter', email);
    $id('newsletterEmail').value='';
    alert('تم الاشتراك بنجاح!');
  });}

  const theme = localStorage.getItem('theme')||'dark';
  document.body.classList.toggle('theme-light', theme==='light');
  document.body.classList.toggle('theme-dark', theme!=='light');
  const year = $id('year'); if(year) year.textContent = new Date().getFullYear();
}

function mountByPage(){
  const page = document.body.dataset.page;
  if(['home','shop','new','sale'].includes(page)){
    renderCats(); bindFilters(); apply();
  }
  if(page==='cart') renderCart();
  if(page==='checkout') renderCheckout();
  if(page==='wishlist') renderWishlist();
  if(page==='admin') mountAdmin();
}

function bindFilters(){
  const sb = $id('searchBtn'), si = $id('searchInput');
  if(sb && si){ sb.onclick = ()=>{ state.q = si.value; apply(); };
    si.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); sb.click(); } });
  }
  const sf = $id('sizeFilter'); if(sf) sf.onchange = (e)=>{ state.size = e.target.value; apply(); };
  const pmin = $id('priceMin'); if(pmin) pmin.oninput = (e)=> state.priceMin = e.target.value;
  const pmax = $id('priceMax'); if(pmax) pmax.oninput = (e)=> state.priceMax = e.target.value;
  const sort = $id('sortSelect'); if(sort) sort.onchange = (e)=>{ state.sort = e.target.value; apply(); };
  const clear = $id('clearFilters'); if(clear) clear.onclick = ()=>{ state.size=''; state.priceMin=''; state.priceMax=''; state.cat=''; state.sort='pop'; state.q=''; const si2=$id('searchInput'); if(si2) si2.value=''; apply(); };
}

// ADMIN (local)
function mountAdmin(){
  const pass = $id('adminPass'), login = $id('adminLogin'), area = $id('adminArea'), list = $id('adminList');
  login.onclick = ()=>{
    if(pass.value === (CFG.ADMIN_PASSWORD||'admin123')){
      area.style.display='block'; renderAdminList();
    }else alert('كلمة مرور غير صحيحة');
  };
  $id('addProd').onclick = ()=> editProduct();
  $id('exportJson').onclick = ()=>{
    const blob = new Blob([JSON.stringify(state.products,null,2)], {type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'products.json'; a.click();
  };
  $id('importFile').addEventListener('change', async (e)=>{
    const file = e.target.files[0]; if(!file) return;
    const txt = await file.text();
    try{
      const data = JSON.parse(txt);
      if(Array.isArray(data)){ state.products = data; saveProducts(); renderAdminList(); alert('تم الاستيراد بنجاح'); }
      else alert('ملف غير صالح');
    }catch(err){ alert('تعذر قراءة الملف'); }
  });
  $id('resetDemo').onclick = ()=>{ localStorage.removeItem('products'); state.products = seed(); saveProducts(); renderAdminList(); };
  function renderAdminList(){
    list.innerHTML='';
    state.products.forEach(p=>{
      const card = document.createElement('div'); card.className='card';
      card.innerHTML = `
        <div class="img"><img src="${p.img}" alt=""></div>
        <div class="body">
          <strong>${p.title}</strong>
          <div class="muted">${p.sku}</div>
          <div class="price-row"><span class="price">${money(p.sale??p.price)}</span> ${p.sale?`<span class="old">${money(p.price)}</span>`:''}</div>
          <div class="actions">
            <button class="btn">تعديل</button>
            <button class="btn">حذف</button>
          </div>
        </div>
      `;
      const [edit, del] = $$$('.btn', card);
      edit.onclick = ()=> editProduct(p);
      del.onclick = ()=>{ if(confirm('حذف المنتج؟')){ state.products = state.products.filter(x=>x.id!==p.id); saveProducts(); renderAdminList(); }};
      list.appendChild(card);
    });
  }
  function editProduct(p){
    const isNew = !p;
    p = p || {id: Date.now(), title:'', sku:'', cat:categories[0], sizes:[...sizes], price:0, sale:null, rating:'4.5', img:'images/prod1.svg', desc:'', createdAt: Date.now()};
    const form = document.createElement('form'); form.className='card'; form.style.padding='16px'; form.style.display='grid'; form.style.gap='8px';
    form.innerHTML=`
      <label>الاسم<input required id="t" value="${p.title}"></label>
      <label>الكود<input required id="s" value="${p.sku}"></label>
      <label>القسم<input id="c" value="${p.cat}"></label>
      <label>السعر<input id="pr" type="number" value="${p.price}"></label>
      <label>سعر الخصم (اختياري)<input id="sa" type="number" value="${p.sale??''}"></label>
      <label>الصورة (رابط)<input id="im" value="${p.img}"></label>
      <label>الوصف<textarea id="d" style="height:120px;background:transparent;color:inherit;border:1px solid var(--border);border-radius:12px;padding:10px">${p.desc}</textarea></label>
      <div class="actions"><button class="btn primary">حفظ</button><button class="btn" type="button" id="cancel">إلغاء</button></div>
    `;
    list.prepend(form);
    form.onsubmit = (e)=>{
      e.preventDefault();
      p.title=$id('t').value; p.sku=$id('s').value; p.cat=$id('c').value||categories[0];
      p.price=+$id('pr').value||0; p.sale=$id('sa').value? +$id('sa').value : null; p.img=$id('im').value||'images/prod1.svg'; p.desc=$id('d').value;
      if(isNew) state.products.unshift(p);
      saveProducts(); renderAdminList();
    };
    $id('cancel').onclick = ()=>{ form.remove(); };
  }
}

// INIT
(function init(){
  // theme + year + SW + counts
  bindChrome();
  state.products = seed();
  setCounts();
  // page mounts
  mountByPage();
  // PWA
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js'); }
})();