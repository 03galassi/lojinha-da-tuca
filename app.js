const KEY="lojinha_tuca_web_v1";
const UI_VERSION="37";
const $=s=>document.querySelector(s);
const money=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(v)||0);
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>Date.now()+Math.floor(Math.random()*10000);
let db=load();
let page="dashboard";

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY));
    if(x) return x;
  }catch(e){}
  return {title:"LOJINHA DA TUCA",products:[],clients:[],sales:[],saleItems:[],payments:[],suppliers:[],payables:[],supplierPayments:[],withdrawals:[]};
}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function nextId(a){return a.length?Math.max(...a.map(x=>Number(x.id)||0))+1:1}
function find(a,id){return a.find(x=>Number(x.id)===Number(id))}
function modal(title,body,buttons=""){
  $("#modalCard").innerHTML=`<div class="modal-head"><div class="modal-title-group"><button class="btn back-btn" onclick="closeModal()">← Voltar</button><h2>${title}</h2></div><button class="icon-btn" onclick="closeModal()" aria-label="Fechar">✕</button></div>${body}${buttons}`;
  $("#modal").classList.remove("hidden");
}
function closeModal(){$("#modal").classList.add("hidden")}
$("#modal").addEventListener("click",e=>e.stopPropagation());
document.addEventListener("keydown",e=>{if(e.key==="Escape")e.preventDefault()});
function formField(label,name,value="",type="text"){
 const extra=name==="cpf"?' inputmode="numeric" maxlength="11" autocomplete="off" oninput="maskCPF(this)"':name==="phone"?' inputmode="tel" maxlength="14" autocomplete="tel" oninput="maskPhone(this)"':'';
 return `<div class="field"><label>${label}</label><input class="form-control" id="f_${name}" type="${type}" value="${esc(value)}"${extra}></div>`
}
function onlyDigits(v){return String(v||"").replace(/\D/g,"")}
function maskCPF(el){el.value=onlyDigits(el.value).slice(0,11)}
function formatPhone(value){let v=onlyDigits(value).slice(0,11);return v.length?("("+v.slice(0,2)+(v.length>2?")":"")+(v.length>2?v.slice(2,7)+(v.length>7?"-":"")+v.slice(7):"")):""}
function maskPhone(el){el.value=formatPhone(el.value)}
function validCPF(value){const cpf=onlyDigits(value);if(!cpf)return true;if(cpf.length!==11||/^(\d)\1{10}$/.test(cpf))return false;let sum=0;for(let i=0;i<9;i++)sum+=Number(cpf[i])*(10-i);let d1=(sum*10)%11;if(d1===10)d1=0;if(d1!==Number(cpf[9]))return false;sum=0;for(let i=0;i<10;i++)sum+=Number(cpf[i])*(11-i);let d2=(sum*10)%11;if(d2===10)d2=0;return d2===Number(cpf[10])}
function selectField(label,name,opts,value=""){return `<div class="field"><label>${label}</label><select class="form-control" id="f_${name}">${opts.map(o=>`<option ${String(o[0])===String(value)?"selected":""} value="${esc(o[0])}">${esc(o[1])}</option>`).join("")}</select></div>`}
function searchableProductField(products,value=""){
 const selected=find(products,value);
 const current=selected?`${selected.description||""} / ${selected.size||"-"} — ${money(selected.sale)} — estoque ${selected.stock}`:"";
 return `<div class="field product-search-field"><label>Produto</label><input class="form-control searchable-product" id="f_product_search" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Digite o produto..." value="${esc(current)}"><input id="f_product_id" type="hidden" value="${esc(value||"")}"><div id="productSearchResults" class="product-search-results hidden"></div><small class="field-help">Digite e a busca será feita na hora por tipo ou descrição.</small></div>`
}
function pageHead(title,actions=""){return `<div class="page-head"><div class="page-title-group"><button class="btn back-btn" onclick="go('dashboard')">← Voltar</button><h1>${title}</h1></div><div class="actions">${actions}</div></div>`}
function table(headers,rows,empty="Nenhum registro"){return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`}
function searchBox(id,placeholder,value){return `<div class="toolbar search-toolbar"><input id="${id}" class="search" type="text" inputmode="search" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="${placeholder}" value="${esc(value||"")}" oninput="render()"><span class="search-hint">⌕</span></div>`}

function decorateTables(){
  document.querySelectorAll('.table').forEach(tbl=>{
    const labels=[...tbl.querySelectorAll('thead th')].map(th=>th.textContent.trim());
    tbl.querySelectorAll('tbody tr').forEach(tr=>{
      [...tr.children].forEach((td,i)=>{ if(td.tagName==='TD' && !td.classList.contains('empty')) td.setAttribute('data-label',labels[i]||''); });
    });
  });
}
function syncMobileMenu(){
  const menu=$('#mobileMenu'); if(!menu)return;
  const labels=[...document.querySelectorAll('#tabs button')];
  menu.innerHTML=labels.map((b,i)=>`<button class="mobile-nav-item mobile-nav-${i%6} ${b.dataset.page===page?'active':''}" data-page="${b.dataset.page}">${b.textContent}<span class="mobile-nav-arrow">›</span></button>`).join('');
}
function closeMobileMenu(){ $('#mobileDrawer')?.classList.add('hidden'); }
function render(){
 const active=document.activeElement;
 const activeId=active?.id||"";
 const activeValue=(active && "value" in active)?active.value:"";
 const activeStart=(active && typeof active.selectionStart==="number")?active.selectionStart:null;
 const activeEnd=(active && typeof active.selectionEnd==="number")?active.selectionEnd:null;
 $("#appTitle").textContent=db.title||"LOJINHA DA TUCA";
 document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 const fn={dashboard:dashboard,products:products,clients:clients,sales:sales,receivables:receivables,suppliers:suppliers,payables:payables,finished:finished,reports:reports}[page];
 $("#content").innerHTML=fn();
 decorateTables();
 syncMobileMenu();
 if(activeId){
   const el=document.getElementById(activeId);
   if(el){
     if("value" in el) el.value=activeValue;
     el.focus({preventScroll:true});
     if(activeStart!==null && typeof el.setSelectionRange==="function") el.setSelectionRange(activeStart,activeEnd);
   }
 }
}
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("button[data-page]");if(b){page=b.dataset.page;render()}});

function dashIcon(type){
 const common='viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
 const m={
  sale:`<svg ${common}><rect x="7" y="9" width="34" height="31" rx="4"/><path d="M14 5v8M34 5v8M7 18h34M14 25l4 4 8-9"/></svg>`,
  products:`<svg ${common}><path d="M6 15 24 6l18 9-18 9L6 15Z"/><path d="M6 15v18l18 9 18-9V15M24 24v18"/></svg>`,
  clients:`<svg ${common}><circle cx="18" cy="16" r="7"/><circle cx="34" cy="19" r="5"/><path d="M6 39c1-8 6-12 12-12s11 4 12 12M29 29c6 0 10 3 12 9"/>`,
  sales:`<svg ${common}><circle cx="17" cy="39" r="3"/><circle cx="37" cy="39" r="3"/><path d="M5 8h6l4 22h22l5-17H13"/></svg>`,
  receive:`<svg ${common}><path d="M24 6c-9 0-15 6-15 13 0 10 15 23 15 23s15-13 15-23C39 12 33 6 24 6Z"/><path d="M29 16c-1-2-3-3-6-3-3 0-5 2-5 4 0 6 11 3 11 9 0 2-2 4-5 4-3 0-5-1-6-3M24 10v25"/>`,
  pay:`<svg ${common}><rect x="5" y="10" width="38" height="27" rx="4"/><path d="M5 18h38M11 28h12"/></svg>`,
  supplier:`<svg ${common}><path d="M5 12h24v24H5zM29 21h8l6 7v8H29z"/><circle cx="13" cy="39" r="3"/><circle cx="35" cy="39" r="3"/><path d="M11 17h12"/>`,
  finished:`<svg ${common}><circle cx="24" cy="24" r="18"/><path d="m15 24 6 6 12-13"/></svg>`,
  reports:`<svg ${common}><path d="M7 40V27M18 40V17M30 40V10M41 40V5"/><path d="M4 40h40"/>`
 };
 return m[type]||'';
}
function dashboard(){
 const stock=db.products.reduce((s,p)=>s+Number(p.stock||0),0);
 const stockValue=db.products.reduce((s,p)=>s+Number(p.stock||0)*Number(p.sale||0),0);
 const receivable=db.sales.reduce((s,x)=>s+Math.max(0,Number(x.total)-Number(x.paid||0)),0);
 const payable=db.payables.reduce((s,x)=>s+Math.max(0,Number(x.total)-Number(x.paid||0)),0);
 const todaySales=db.sales.filter(x=>x.sale_date===today()).reduce((s,x)=>s+Number(x.total||0),0);
 const monthKey=today().slice(0,7);
 const monthSales=db.sales.filter(x=>(x.sale_date||'').slice(0,7)===monthKey).reduce((s,x)=>s+Number(x.total||0),0);
 const shortcuts=[
  ['sale','NOVA VENDA',"newSale()"],['products','PRODUTOS',"go('products')"],['clients','CLIENTES',"go('clients')"],
  ['sales','VENDAS',"go('sales')"],['receive','A RECEBER',"go('receivables')"],['pay','A PAGAR',"go('payables')"],
  ['supplier','FORNECEDORES',"go('suppliers')"],['finished','FINALIZADAS',"go('finished')"],['reports','RELATÓRIOS',"go('reports')"]
 ];
 const tiles=shortcuts.map(x=>`<button class="home-tile" onclick="${x[2]}"><span class="home-tile-icon">${dashIcon(x[0])}</span><span>${x[1]}</span></button>`).join('');
 return `<div class="home-layout">
   <section class="home-welcome"><div><strong>LOJINHA DA TUCA</strong><small>Gestão da loja</small></div><div class="home-date">${new Date().toLocaleDateString('pt-BR')}</div></section>
   <div class="home-action"><button class="btn primary" onclick="newSale()">+ Nova venda</button></div>
   <section class="home-shortcuts">${tiles}</section>
   <button class="home-panel-title home-report-link" onclick="go('reports')"><h1>Painel da loja</h1><span>Ver relatório completo →</span></button>
   <section class="home-metrics">
    <button class="home-metric metric-sale" onclick="go('sales')"><span><b>Vendas hoje</b><strong>${money(todaySales)}</strong></span><i>${dashIcon('sales')}</i></button>
    <button class="home-metric metric-clients" onclick="go('clients')"><span><b>Clientes</b><strong>${db.clients.length}</strong></span><i>${dashIcon('clients')}</i></button>
    <button class="home-metric metric-products" onclick="go('products')"><span><b>Produtos</b><strong>${stock}</strong></span><i>${dashIcon('products')}</i></button>
    <button class="home-metric metric-receive" onclick="go('receivables')"><span><b>A receber</b><strong>${money(receivable)}</strong></span><i>${dashIcon('receive')}</i></button>
    <button class="home-metric metric-pay" onclick="go('payables')"><span><b>A pagar</b><strong>${money(payable)}</strong></span><i>${dashIcon('pay')}</i></button>
    <button class="home-metric metric-month" onclick="go('sales')"><span><b>Vendas mês</b><strong>${money(monthSales)}</strong></span><i>${dashIcon('reports')}</i></button>
   </section>
   <div class="home-stock"><span>Valor do estoque (preço de venda)</span><strong>${money(stockValue)}</strong></div>
 </div>`;
}
function go(p){page=p;render()}
function recentSales(){
 const rows=[...db.sales].sort((a,b)=>Number(b.id)-Number(a.id)).slice(0,8).map(s=>{
 const c=find(db.clients,s.client_id); return `<tr><td>${esc(s.sale_date)}</td><td>${esc(c?.name||"Não informado")}</td><td class="money">${money(s.total)}</td><td>${money(s.paid)}</td><td>${money(Math.max(0,s.total-s.paid))}</td></tr>`});
 return table(["Data","Cliente","Total","Pago","Saldo"],rows.join(""))
}

function products(){
 let q=($("#pq")?.value||"").toLowerCase().trim();
 const rows=db.products.filter(p=>(`${p.kind||""} ${p.description||""}`).toLowerCase().includes(q)).map(p=>`<tr>
 <td>${esc(p.code)}</td><td>${esc(p.kind)}</td><td>${esc(p.gender||"Não informado")}</td><td>${esc(p.description)}</td><td>${esc(p.size)}</td><td>${money(p.cost)}</td><td>${Number(p.margin||0).toFixed(2)}%</td><td class="money">${money(p.sale)}</td><td>${p.stock}</td>
 <td class="nowrap"><button class="icon-btn" onclick="editProduct(${p.id})">Editar</button> <button class="icon-btn" onclick="restock(${p.id})">Repor</button> <button class="icon-btn" onclick="deleteProduct(${p.id})">Excluir</button></td></tr>`);
 return pageHead("Produtos",`<button class="btn primary" onclick="newProduct()">+ Novo produto</button>`) +
 `<div class="panel">${searchBox("pq","Buscar produto por tipo ou descrição...",q)}${table(["Código","Tipo","Gênero","Descrição","Tamanho","Custo","Margem","Venda","Estoque","Ações"],rows.join(""))}</div>`;
}
function productForm(p={}){
 const margins=[["30","30%"],["50","50%"],["80","80%"],["100","100%"],["Outra","Outra"]];
 const savedMargin=String(p.margin??"");
 const marginKnown=margins.some(o=>o[0]===savedMargin);
 const marginField=selectField("Margem %","margin",margins,marginKnown?savedMargin:"50");
 const gender=String(p.gender||"Masculino");
 const body=`<div class="grid2">${selectField("Tipo","kind",[["Blusa","Blusa"],["Camiseta","Camiseta"],["Calça Jeans","Calça Jeans"],["Shorts","Shorts"],["Vestido","Vestido"],["Saia","Saia"],["Conjunto","Conjunto"],["Outro","Outro"]],p.kind)}
 ${selectField("Gênero","gender",[["Masculino","Masculino"],["Feminino","Feminino"]],gender)}${formField("Descrição","description",p.description)}
 ${formField("Tamanho","size",p.size)}
 ${formField("Custo","cost",p.cost,"number")}${marginField}
 ${formField("Preço de venda","sale",p.sale,"number")}${formField("Estoque","stock",p.stock||0,"number")}</div>
 <div id="customMarginWrap" class="field" style="margin-top:10px;display:none"><label>Margem personalizada %</label><input id="f_customMargin" type="number" step="0.01" min="0" value="${marginKnown?"":esc(savedMargin)}"></div>
 <div class="field" style="margin-top:10px"><label>Observação</label><textarea id="f_observation">${esc(p.observation||"")}</textarea></div>`;
 return body;
}
function setupProductCalc(){
 const cost=$("#f_cost"), margin=$("#f_margin"), sale=$("#f_sale"), custom=$("#f_customMargin"), wrap=$("#customMarginWrap");
 if(!cost||!margin||!sale)return;
 let manual=false;
 const getMargin=()=>margin.value==="Outra"?Number(custom?.value||0):Number(margin.value||0);
 const calc=()=>{const c=Number(String(cost.value).replace(",","."))||0; const m=getMargin(); if(!manual){sale.value=(c*(1+m/100)).toFixed(2)}};
 const toggle=()=>{if(margin.value==="Outra"){wrap.style.display="block";}else{wrap.style.display="none";} manual=false; calc();};
 cost.addEventListener("input",()=>{manual=false;calc()});
 margin.addEventListener("change",toggle);
 if(custom)custom.addEventListener("input",()=>{manual=false;calc()});
 sale.addEventListener("input",()=>{manual=true});
 if(margin.value==="Outra")wrap.style.display="block";
 if(!sale.value || !Number(sale.value))calc();
}
function newProduct(){modal("Novo produto",productForm(),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">← Voltar</button><button class="btn primary" onclick="saveProduct()">Salvar</button></div>`);setupProductCalc()}
function editProduct(id){const p=find(db.products,id);modal("Editar produto",productForm(p),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">← Voltar</button><button class="btn primary" onclick="saveProduct(${id})">Salvar</button></div>`);setupProductCalc()}
function saveProduct(id){
 const v=n=>$("#f_"+n).value.trim(), p=find(db.products,id)||{id:nextId(db.products)};
 const marginValue=v("margin")==="Outra"?(Number($("#f_customMargin")?.value)||0):Number(v("margin"))||0;
 const costValue=Number(v("cost").replace(",","."))||0;
 const saleValue=Number(v("sale").replace(",","."))||0;
 Object.assign(p,{code:p.code||"",kind:v("kind"),gender:v("gender"),description:v("description"),size:v("size"),cost:costValue,margin:marginValue,sale:saleValue,stock:Math.max(0,parseInt(v("stock"))||0),observation:$("#f_observation").value});
 if(!id)db.products.push(p);save();closeModal();render();toast("Produto salvo")}
function deleteProduct(id){if(db.saleItems.some(x=>Number(x.product_id)===Number(id)))return alert("Este produto possui histórico de vendas e não pode ser excluído.");if(confirm("Excluir este produto?")){db.products=db.products.filter(x=>x.id!==id);save();render()}}
function restock(id){const n=prompt("Quantidade a adicionar:","1");const q=parseInt(n);if(q>0){const p=find(db.products,id);p.stock+=q;p.exhausted_at=null;save();render();toast("Estoque atualizado")}}

function clients(){
 let q=($("#cq")?.value||"").toLowerCase().trim();
 const rows=db.clients.filter(c=>(c.name||"").toLowerCase().includes(q)).map(c=>`<tr ondblclick="clientDetails(${c.id})"><td>${esc(c.name)}</td><td>${esc(c.cpf||"")}</td><td>${esc(c.phone||"")}</td><td>${esc(c.address||"")}</td><td><button class="icon-btn" onclick="event.stopPropagation();editClient(${c.id})">Editar</button> <button class="icon-btn" onclick="deleteClient(${c.id})">Excluir</button></td></tr>`);
 return pageHead("Clientes",`<button class="btn primary" onclick="newClient()">+ Novo cliente</button>`) + `<div class="panel">${searchBox("cq","Buscar cliente por nome e sobrenome...",q)}${table(["Nome","CPF","Telefone","Endereço","Ações"],rows.join(""))}</div>`;
}
function clientForm(c={}){
 return `<div class="grid2">${formField("Nome completo","name",c.name)}${formField("CPF","cpf",onlyDigits(c.cpf||""))}${formField("Telefone","phone",formatPhone(c.phone||""))}${formField("Endereço","address",c.address)}</div><div class="field" style="margin-top:10px"><label>Observações</label><textarea id="f_notes">${esc(c.notes||"")}</textarea></div>`;
}
function newClient(prefill=""){modal("Novo cliente",clientForm({name:prefill}),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">← Voltar</button><button class="btn primary" onclick="saveClient()">Salvar</button></div>`)}
function clientDetails(id){
 const c=find(db.clients,id); if(!c)return; const sales=db.sales.filter(s=>Number(s.client_id)===Number(id));
 const total=sales.reduce((a,s)=>a+Number(s.total||0),0), paid=sales.reduce((a,s)=>a+Number(s.paid||0),0);
 modal("Detalhes do cliente",`<div class="detail-grid"><p><b>Nome:</b> ${esc(c.name||"")}</p><p><b>CPF:</b> ${esc(c.cpf||"")}</p><p><b>Telefone:</b> ${esc(c.phone||"")}</p><p><b>Endereço:</b> ${esc(c.address||"")}</p><p><b>Total de vendas:</b> ${sales.length}</p><p><b>Valor vendido:</b> ${money(total)}</p><p><b>Recebido:</b> ${money(paid)}</p><p><b>Em aberto:</b> ${money(Math.max(0,total-paid))}</p><p><b>Observações:</b> ${esc(c.notes||"")}</p></div>`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Fechar</button><button class="btn primary" onclick="closeModal();editClient(${id})">Editar</button></div>`)
}
function editClient(id){const c=find(db.clients,id);modal("Editar cliente",clientForm(c),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">← Voltar</button><button class="btn primary" onclick="saveClient(${id})">Salvar</button></div>`)}
function saveClient(id){
 const v=n=>$("#f_"+n).value.trim(),c=find(db.clients,id)||{id:nextId(db.clients)};
 const cpf=onlyDigits(v("cpf")),phone=onlyDigits(v("phone"));
 if(!c.name)return alert("Informe o nome.");
 if(cpf && cpf.length!==11)return alert("CPF deve conter exatamente 11 dígitos ou ficar em branco.");
 if(cpf && !validCPF(cpf))return alert("CPF inválido. Informe um CPF válido com 11 dígitos ou deixe o campo em branco.");
 if(phone && !/^\d{11}$/.test(phone))return alert("Telefone inválido. Use exatamente o formato (00)00000-0000.");
 Object.assign(c,{name:v("name"),cpf:cpf,phone:formatPhone(phone),address:v("address"),notes:$("#f_notes").value});
 if(!id)db.clients.push(c);save();closeModal();render();toast("Cliente salvo")}
function deleteClient(id){if(db.sales.some(s=>Number(s.client_id)===Number(id)))return alert("Este cliente possui histórico de vendas e não pode ser excluído.");if(confirm("Excluir este cliente?")){db.clients=db.clients.filter(x=>x.id!==id);save();render()}}

function sales(){
 const q=(document.getElementById("sq")?.value||"").toLowerCase().trim();
 const rows=[...db.sales].sort((a,b)=>b.id-a.id).filter(s=>{const c=find(db.clients,s.client_id);const text=`${s.sale_date} ${c?.name||""} ${s.payment||""} ${s.due_date||""}`.toLowerCase();return text.includes(q)}).map(s=>{const c=find(db.clients,s.client_id),bal=Math.max(0,s.total-s.paid);return `<tr class="${s.due_date&&s.due_date<today()&&bal>0?"row-late":""}" onclick="saleDetails(${s.id})"><td>${s.sale_date}</td><td>${esc(c?.name||"Não informado")}</td><td>${money(s.total)}</td><td>${esc(s.payment||"")}</td><td>${s.installments||1}</td><td>${s.due_date||""}</td><td>${money(s.paid)}</td><td class="money">${money(bal)}</td><td class="nowrap"><button class="icon-btn" onclick="event.stopPropagation();saleDetails(${s.id})">Detalhes</button> <button class="icon-btn" onclick="event.stopPropagation();payment(${s.id})">Pagamento</button> <button class="icon-btn" onclick="event.stopPropagation();deleteSale(${s.id})">Excluir</button></td></tr>`});
 return pageHead("Vendas",`<button class="btn primary" onclick="newSale()">+ Nova venda</button>`) + `<div class="panel">${searchBox("sq","Buscar por cliente, data ou forma de pagamento...",q)}${table(["Data","Cliente","Total","Pagamento","Parcelas","Vencimento","Pago","Saldo","Ações"],rows.join(""))}</div>`;
}
function saleDetails(id){
 const s=find(db.sales,id); if(!s)return; const c=find(db.clients,s.client_id); const items=db.saleItems.filter(i=>Number(i.sale_id)===Number(id));
 const lista=items.map(i=>{const p=find(db.products,i.product_id);return `<tr><td>${esc(p?.description||"Produto")}</td><td>${esc(p?.size||"")}</td><td>${i.qty}</td><td>${money(i.price)}</td><td>${money(Number(i.qty)*Number(i.price))}</td></tr>`}).join("");
 modal("Detalhes da venda",`<p><b>Data:</b> ${s.sale_date} &nbsp; <b>Cliente:</b> ${esc(c?.name||"Não informado")}</p><p><b>Pagamento:</b> ${esc(s.payment||"")} &nbsp; <b>Parcelas:</b> ${s.installments||1} &nbsp; <b>Vencimento:</b> ${s.due_date||""}</p><p><b>Total:</b> ${money(s.total)} &nbsp; <b>Recebido:</b> ${money(s.paid)} &nbsp; <b>Saldo:</b> ${money(Math.max(0,s.total-s.paid))}</p><div class="panel"><table><thead><tr><th>Produto</th><th>Tamanho</th><th>Qtd.</th><th>Preço</th><th>Subtotal</th></tr></thead><tbody>${lista||'<tr><td colspan="5">Nenhum item</td></tr>'}</tbody></table></div>`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Fechar</button></div>`)
}
function newSale(){
 if(!db.products.some(p=>Number(p.stock)>0))return alert("Não há produtos disponíveis para venda.");
 const clients=[["","Selecione..."],...db.clients.map(c=>[c.id,c.name])];
 const prods=[...db.products.filter(p=>Number(p.stock)>0)];
 modal("Nova venda",`<div class="grid2">${selectField("Cliente","client_id",clients)}${searchableProductField(prods,"")}${formField("Quantidade","qty",1,"number")}${formField("Preço original","original_price",0,"number")}${formField("Valor da venda","sale_price",0,"number")}${selectField("Desconto","discount_option",[["0","Sem desconto"],["5","5%"],["10","10%"],["15","15%"],["20","20%"],["other","Outra"]],"0")}${formField("Desconto %","discount",0,"number")}${selectField("Pagamento","payment",[["Crédito","Crédito"],["À vista","À vista"]],"Crédito")}${selectField("Parcelas","installments",[["1","1x"],["2","2x"],["3","3x"],["4","4x"],["5","5x"],["6","6x"]],1)}${formField("Vencimento","due_date",today(),"date")}</div><div class="panel" style="margin-top:12px"><b>Total da venda: <span id="saleTotal">${money(0)}</span></b></div>`, `<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">← Voltar</button><button class="btn primary" onclick="saveSale()">Confirmar venda</button></div>`);
 const ps=$("#f_product_search"), results=$("#productSearchResults");
 results.addEventListener("pointerdown",e=>{
   const option=e.target.closest(".product-search-option");
   if(!option) return;
   e.preventDefault();
   e.stopPropagation();
   selectSaleProduct(Number(option.dataset.productId));
 });
 function showResults(term=""){
   const q=term.trim().toLowerCase();
   const matches=prods.filter(p=>`${p.kind||""} ${p.description||""} ${p.size||""}`.toLowerCase().includes(q));
   results.innerHTML=matches.length?matches.map(p=>`<button type="button" class="product-search-option" data-product-id="${p.id}"><span><b>${esc(p.description||"Sem descrição")}</b><small>${esc(p.kind||"")}${p.size?` • Tam. ${esc(p.size)}`:""}</small></span><strong>${money(p.sale)}<small> estoque: ${p.stock}</small></strong></button>`).join(""): `<div class="product-search-empty">Nenhum produto encontrado.</div>`;
   results.classList.remove("hidden");
   results.hidden=false;
   results.style.display="block";
 }
 ps.addEventListener("focus",()=>showResults(ps.value));
 ps.addEventListener("input",()=>{ $("#f_product_id").value=""; $("#f_original_price").value="0"; $("#f_sale_price").value="0"; $("#f_discount").value="0"; showResults(ps.value); calcSale(); });
 document.addEventListener("click",function closeProductSearch(e){if(!e.target.closest(".product-search-field")){results.classList.add("hidden");document.removeEventListener("click",closeProductSearch)}});
 ["qty"].forEach(id=>$("#f_"+id).addEventListener("input",calcSale));
 $("#f_discount_option").addEventListener("change",()=>{
   const opt=$("#f_discount_option").value;
   if(opt!=="other"){ $("#f_discount").value=Number(opt)||0; updateSaleFromDiscount(); }
   else { $("#f_discount").focus(); }
 });
 $("#f_sale_price").addEventListener("input",()=>updateSaleFromPrice());
 $("#f_discount").addEventListener("input",()=>updateSaleFromDiscount());
 calcSale();
}
function selectSaleProduct(id){
 const p=find(db.products,id); if(!p)return;
 $("#f_product_id").value=id;
 $("#f_product_search").value=`${p.description||""} / ${p.size||"-"} — ${money(p.sale)} — estoque ${p.stock}`;
 $("#f_original_price").value=Number(p.sale||0).toFixed(2);
 $("#f_sale_price").value=Number(p.sale||0).toFixed(2);
 $("#f_discount").value="0";
 $("#f_discount_option").value="0";
 const results=$("#productSearchResults");
 if(results){
   results.classList.add("hidden");
   results.hidden=true;
   results.style.setProperty("display","none","important");
   results.style.setProperty("visibility","hidden","important");
   results.style.setProperty("pointer-events","none","important");
   results.innerHTML="";
 }
 $("#f_product_search")?.blur();
 calcSale();
}
function calcSale(){
 const p=find(db.products,$("#f_product_id")?.value);
 const price=Number($("#f_sale_price")?.value)||0;
 if($("#f_original_price"))$("#f_original_price").value=p?Number(p.sale||0).toFixed(2):"0";
 if($("#saleTotal"))$("#saleTotal").textContent=money(price*(parseInt($("#f_qty")?.value)||0));
}
function syncDiscountOption(d){
 const opts=[0,5,10,15,20];
 const exact=opts.find(x=>Math.abs(x-Number(d))<0.005);
 if($("#f_discount_option")) $("#f_discount_option").value=exact!==undefined?String(exact):"other";
}
function updateSaleFromPrice(){
 const original=Number($("#f_original_price")?.value)||0;
 let price=Number(String($("#f_sale_price")?.value||0).replace(",","."))||0;
 if(price<0)price=0;
 if(original>0){let d=((original-price)/original)*100;if(d<0)d=0;$("#f_discount").value=d.toFixed(2); syncDiscountOption(d)}
 calcSale();
}
function updateSaleFromDiscount(){
 const original=Number($("#f_original_price")?.value)||0;
 let d=Number(String($("#f_discount")?.value||0).replace(",","."))||0;
 d=Math.max(0,Math.min(100,d));
 $("#f_discount").value=d;
 syncDiscountOption(d);
 $("#f_sale_price").value=(original*(1-d/100)).toFixed(2);
 calcSale();
}
function saveSale(){
 const p=find(db.products,$("#f_product_id").value),q=parseInt($("#f_qty").value)||0,cid=$("#f_client_id").value;
 if(!p||q<=0)return alert("Selecione produto e quantidade.");
 if(q>p.stock)return alert(`Estoque disponível: ${p.stock}.`);
 if(!cid)return alert("Para registrar a venda, selecione um cliente cadastrado.");
 const unitPrice=Math.max(0,Number($("#f_sale_price").value)||0), total=q*unitPrice;
 if(unitPrice<=0)return alert("Informe o valor da venda.");
 const pay=$("#f_payment").value, paid=pay==="À vista"?total:0;
 const s={id:nextId(db.sales),client_id:Number(cid),sale_date:today(),total,paid,payment:pay,installments:parseInt($("#f_installments").value)||1,due_date:$("#f_due_date").value,discount:Number($("#f_discount").value)||0};
 db.sales.push(s);db.saleItems.push({id:nextId(db.saleItems),sale_id:s.id,product_id:p.id,qty:q,price:unitPrice});p.stock-=q;if(p.stock===0)p.exhausted_at=today();save();closeModal();render();toast("Venda registrada")}
function deleteSale(id){if(!confirm("Excluir a venda? O item voltará ao estoque e os pagamentos serão removidos."))return;db.saleItems.filter(x=>x.sale_id===id).forEach(it=>{const p=find(db.products,it.product_id);if(p)p.stock+=Number(it.qty)});db.saleItems=db.saleItems.filter(x=>x.sale_id!==id);db.payments=db.payments.filter(x=>x.sale_id!==id);db.sales=db.sales.filter(x=>x.id!==id);save();render();toast("Venda excluída")}
function payment(id){
 const s=find(db.sales,id),bal=Math.max(0,s.total-s.paid);if(bal<=.005)return alert("Venda já quitada.");
 modal("Registrar pagamento",`<p>Saldo atual: <b>${money(bal)}</b></p><div class="grid2">${formField("Valor","amount",bal,"number")}${formField("Data","pay_date",today(),"date")}</div>`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">← Voltar</button><button class="btn primary" onclick="savePayment(${id})">Confirmar pagamento</button></div>`)
}
function savePayment(id){const s=find(db.sales,id),bal=Math.max(0,s.total-s.paid),v=Number($("#f_amount").value)||0;if(v<=0||v>bal)return alert("Valor inválido.");s.paid+=v;db.payments.push({id:nextId(db.payments),sale_id:id,pay_date:$("#f_pay_date").value,amount:v});save();closeModal();render();toast("Pagamento registrado")}

function receivables(){
 const q=(document.getElementById("rq")?.value||"").toLowerCase().trim();
 const open=db.sales.filter(s=>s.total>s.paid);
 const rows=open.sort((a,b)=>(a.due_date||"").localeCompare(b.due_date||"")).filter(s=>{const c=find(db.clients,s.client_id);const late=s.due_date&&s.due_date<today();const text=`${c?.name||""} ${s.sale_date} ${s.due_date||""} ${late?"atrasado":"em aberto"}`.toLowerCase();return text.includes(q)}).map(s=>{const c=find(db.clients,s.client_id),bal=s.total-s.paid,late=s.due_date&&s.due_date<today();return `<tr class="${late?"row-late":""}"><td>${esc(c?.name||"Não informado")}</td><td>${s.sale_date}</td><td>${s.due_date||""}</td><td>${money(s.total)}</td><td>${money(s.paid)}</td><td class="money">${money(bal)}</td><td><span class="status ${late?"bad":"open"}">${late?"ATRASADO":"EM ABERTO"}</span></td><td><button class="icon-btn" onclick="payment(${s.id})">Pagamento</button>${c?.phone?` <button class="icon-btn" onclick="whatsapp(${s.id})">WhatsApp</button>`:""}</td></tr>`});
 return pageHead("Contas a Receber") + `<div class="panel">${searchBox("rq","Buscar cliente, vencimento ou status...",q)}${table(["Cliente","Venda","Vencimento","Total","Pago","Saldo","Status","Ações"],rows.join(""))}</div>`;
}
function whatsapp(id){
 const s=find(db.sales,id),c=find(db.clients,s.client_id);
 if(!c||!c.phone)return alert("Cliente sem telefone cadastrado.");
 let phone=String(c.phone).replace(/\D/g,"");
 // Aceita telefone brasileiro com ou sem DDD e com/sem 55. Remove zero de operadora quando existir.
 if(phone.startsWith("0055")) phone=phone.slice(2);
 if(phone.startsWith("55") && (phone.length===12||phone.length===13)) { /* já contém país */ }
 else if(phone.length===10||phone.length===11) phone="55"+phone;
 else if(phone.length===8||phone.length===9) phone="5567"+phone;
 else if(phone.length>=12 && phone.length<=13 && !phone.startsWith("55")) phone="55"+phone;
 else return alert("Telefone inválido. Cadastre com DDD, por exemplo: (67) 99999-9999.");
 const v=money(Math.max(0,Number(s.total)-Number(s.paid||0)));
 const first=(c.name||"cliente").trim().split(/\s+/)[0];
 const msg=`Oi ${first}, tudo bem? Tem uma parcela sua de ${v} em aberto. Consegue me mandar?`;
 const url=`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
 window.location.href=url;
}

function suppliers(){
 const q=(document.getElementById("fq")?.value||"").toLowerCase().trim();
 const rows=db.suppliers.filter(s=>`${s.name||""} ${s.phone||""} ${s.document||""} ${s.address||""}`.toLowerCase().includes(q)).map(s=>`<tr onclick="supplierDetails(${s.id})"><td>${esc(s.name)}</td><td>${esc(s.phone)}</td><td>${esc(s.document)}</td><td>${esc(s.address)}</td><td><button class="icon-btn" onclick="event.stopPropagation();supplierDetails(${s.id})">Detalhes</button> <button class="icon-btn" onclick="event.stopPropagation();editSupplier(${s.id})">Editar</button> <button class="icon-btn" onclick="event.stopPropagation();deleteSupplier(${s.id})">Excluir</button></td></tr>`);
 return pageHead("Fornecedores",`<button class="btn primary" onclick="newSupplier()">+ Novo fornecedor</button>`) + `<div class="panel">${searchBox("fq","Buscar fornecedor, telefone ou CPF/CNPJ...",q)}${table(["Fornecedor","Telefone","CPF/CNPJ","Endereço","Ações"],rows.join(""))}</div>`;
}
function supplierForm(s={}){return `<div class="grid2">${formField("Nome","name",s.name)}${formField("Telefone","phone",s.phone)}${formField("CPF/CNPJ","document",s.document)}${formField("Endereço","address",s.address)}</div><div class="field" style="margin-top:10px"><label>Observações</label><textarea id="f_notes">${esc(s.notes||"")}</textarea></div>`}
function supplierDetails(id){
 const s=find(db.suppliers,id); if(!s)return; const buys=db.payables.filter(p=>Number(p.supplier_id)===Number(id)); const total=buys.reduce((a,p)=>a+Number(p.total||0),0),paid=buys.reduce((a,p)=>a+Number(p.paid||0),0);
 modal("Detalhes do fornecedor",`<div class="detail-grid"><p><b>Fornecedor:</b> ${esc(s.name||"")}</p><p><b>Telefone:</b> ${esc(s.phone||"")}</p><p><b>CPF/CNPJ:</b> ${esc(s.document||"")}</p><p><b>Endereço:</b> ${esc(s.address||"")}</p><p><b>Compras/contas:</b> ${buys.length}</p><p><b>Total:</b> ${money(total)}</p><p><b>Pago:</b> ${money(paid)}</p><p><b>Em aberto:</b> ${money(Math.max(0,total-paid))}</p><p><b>Observações:</b> ${esc(s.notes||"")}</p></div>`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Fechar</button><button class="btn primary" onclick="closeModal();editSupplier(${id})">Editar</button></div>`)
}
function newSupplier(){modal("Novo fornecedor",supplierForm(),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">← Voltar</button><button class="btn primary" onclick="saveSupplier()">Salvar</button></div>`)}
function editSupplier(id){modal("Editar fornecedor",supplierForm(find(db.suppliers,id)),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">← Voltar</button><button class="btn primary" onclick="saveSupplier(${id})">Salvar</button></div>`)}
function saveSupplier(id){const v=n=>$("#f_"+n).value.trim(),s=find(db.suppliers,id)||{id:nextId(db.suppliers)};Object.assign(s,{name:v("name"),phone:v("phone"),document:v("document"),address:v("address"),notes:$("#f_notes").value});if(!s.name)return alert("Informe o nome.");if(!id)db.suppliers.push(s);save();closeModal();render();toast("Fornecedor salvo")}
function deleteSupplier(id){if(db.payables.some(p=>p.supplier_id===id))return alert("Este fornecedor possui contas registradas.");if(confirm("Excluir fornecedor?")){db.suppliers=db.suppliers.filter(x=>x.id!==id);save();render()}}

function payables(){
 const q=(document.getElementById("pq2")?.value||"").toLowerCase().trim();
 const rows=db.payables.sort((a,b)=>(a.due_date||"").localeCompare(b.due_date||"")).filter(p=>{const s=find(db.suppliers,p.supplier_id),bal=p.total-p.paid,late=p.due_date&&p.due_date<today();const text=`${s?.name||""} ${p.description||""} ${p.due_date||""} ${late?"atrasado":bal<=0?"pago":"em aberto"}`.toLowerCase();return text.includes(q)}).map(p=>{const s=find(db.suppliers,p.supplier_id),bal=p.total-p.paid,late=p.due_date&&p.due_date<today();return `<tr class="${late&&bal>0?"row-late":""}" onclick="payableDetails(${p.id})"><td>${esc(s?.name||"Não informado")}</td><td>${esc(p.description)}</td><td>${p.due_date||""}</td><td>${p.installments>1?`${p.installment_number}/${p.installments}`:"1/1"}</td><td>${money(p.total)}</td><td>${money(p.paid)}</td><td class="money">${money(bal)}</td><td><span class="status ${bal<=0?"ok":late?"bad":"open"}">${bal<=0?"PAGO":late?"ATRASADO":"EM ABERTO"}</span></td><td class="payable-actions-cell"><div class="payable-row-actions"><button class="icon-btn" onclick="event.stopPropagation();payableDetails(${p.id})">Detalhes</button><button class="icon-btn" onclick="event.stopPropagation();supplierPayment(${p.id})">Pagamento</button><button class="icon-btn" onclick="event.stopPropagation();editPayable(${p.id})">Editar</button><button class="icon-btn danger-action" onclick="event.stopPropagation();deletePayable(${p.id})">Excluir</button></div></td></tr>`});
 const header=`<div class="payables-page-header" style="display:block!important;width:100%!important;margin:0 0 14px!important;padding:0!important;"><h1 style="display:block!important;width:100%!important;margin:0 0 12px!important;font-size:26px!important;line-height:1.15!important;white-space:nowrap!important;">Contas a Pagar</h1><div class="payables-page-buttons" style="display:grid!important;grid-template-columns:1fr 1fr 1.35fr!important;gap:8px!important;width:100%!important;"><button class="btn ghost" style="width:100%!important;white-space:nowrap!important;" onclick="go('dashboard')">← Voltar</button><button class="btn warn" style="width:100%!important;white-space:nowrap!important;" onclick="withdrawal()">Saque</button><button class="btn primary" style="width:100%!important;white-space:nowrap!important;" onclick="newPayable()">+ Nova conta</button></div></div>`;
 return header + `<div class="panel">${searchBox("pq2","Buscar fornecedor, descrição, vencimento ou status...",q)}${table(["Fornecedor","Descrição","Vencimento","Parcela","Total","Pago","Saldo","Status","Ações"],rows.join(""))}</div>`;
}
function deletePayable(id){
 const p=find(db.payables,id);
 if(!p)return;
 const label=p.description||"este lançamento";
 if(!confirm(`Excluir ${label}? Esta ação também removerá os pagamentos/comprovantes vinculados a este lançamento.`))return;
 db.supplierPayments=db.supplierPayments.filter(x=>Number(x.payable_id)!==Number(id));
 db.payables=db.payables.filter(x=>Number(x.id)!==Number(id));
 save();render();toast("Lançamento excluído");
}
function payableDetails(id){
 const p=find(db.payables,id); if(!p)return; const s=find(db.suppliers,p.supplier_id); const status=p.paid>=p.total?"PAGO":(p.due_date&&p.due_date<today()?"ATRASADO":"EM ABERTO");
 modal("Detalhes da compra / conta a pagar",`<div class="detail-grid"><p><b>Fornecedor:</b> ${esc(s?.name||"Não informado")}</p><p><b>Descrição:</b> ${esc(p.description||"")}</p><p><b>Vencimento:</b> ${p.due_date||""}</p><p><b>Parcela:</b> ${p.installments>1?`${p.installment_number}/${p.installments}`:"1/1"}</p><p><b>Total da compra:</b> ${money(p.installments_total||p.total)}</p><p><b>Valor da parcela:</b> ${money(p.total)}</p><p><b>Pago:</b> ${money(p.paid)}</p><p><b>Saldo:</b> ${money(Math.max(0,p.total-p.paid))}</p><p><b>Status:</b> ${status}</p></div>`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Fechar</button><button class="btn primary" onclick="closeModal();editPayable(${id})">Editar</button></div>`)
}
function addMonths(dateStr, months){
 const d=new Date((dateStr||today())+"T12:00:00");
 d.setMonth(d.getMonth()+months);
 const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");
 return `${y}-${m}-${day}`;
}
function payableForm(p={},isEdit=false){
 const opts=[["","Selecione..."],...db.suppliers.map(s=>[s.id,s.name])];
 const installments=p.installments||1;
 return `<div class="grid2">${selectField("Fornecedor","supplier_id",opts,p.supplier_id)}${formField("Descrição","description",p.description)}${formField("Vencimento da 1ª parcela","due_date",p.due_date||today(),"date")}${formField("Total da compra","total",p.installments_total||p.total||0,"number")}${isEdit?formField("Parcela atual","installments",installments,"number"):selectField("Número de parcelas","installments",[["1","1x"],["2","2x"],["3","3x"],["4","4x"],["5","5x"],["6","6x"]],installments)}</div><div class="hint" style="margin-top:8px">${isEdit?"Cada parcela é controlada separadamente em A Pagar.":"O total será dividido automaticamente e cada parcela terá vencimento mensal."}</div>`
}
function newPayable(){if(!db.suppliers.length)return alert("Cadastre um fornecedor primeiro.");modal("Nova compra / conta a pagar",payableForm(),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">← Voltar</button><button class="btn primary" onclick="savePayable()">Salvar compra</button></div>`)}
function editPayable(id){modal("Editar conta",payableForm(find(db.payables,id),true),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">← Voltar</button><button class="btn primary" onclick="savePayable(${id})">Salvar</button></div>`)}
function savePayable(id){
 const supplierId=Number($("#f_supplier_id").value)||null, description=$("#f_description").value.trim(), firstDue=$("#f_due_date").value, total=Number($("#f_total").value)||0, installments=Math.max(1,parseInt($("#f_installments").value)||1);
 if(!supplierId||!description||total<=0||!firstDue)return alert("Preencha os dados.");
 if(id){
   const p=find(db.payables,id); if(!p)return;
   if(Number(p.paid||0)>total)return alert("O total não pode ser menor que o valor já pago.");
   Object.assign(p,{supplier_id:supplierId,description,due_date:firstDue,total,installments_total:p.installments_total||p.total,installment_number:p.installment_number||1,installments:p.installments||1});
   save();closeModal();render();toast("Conta salva");return;
 }
 const cents=Math.round(total*100), base=Math.floor(cents/installments), remainder=cents-base*installments, groupId=Date.now();
 for(let i=1;i<=installments;i++){
   const parcelaCents=base+(i<=remainder?1:0);
   db.payables.push({id:nextId(db.payables),supplier_id:supplierId,description:installments>1?`${description} - Parcela ${i}/${installments}`:description,due_date:addMonths(firstDue,i-1),total:parcelaCents/100,paid:0,created_date:today(),installments_total:total,installment_number:i,installments,installment_group:groupId});
 }
 save();closeModal();render();toast(installments>1?`${installments} parcelas lançadas em A Pagar`:'Conta salva');
}
let paymentReceiptData=null;
function supplierPayment(id){
 const p=find(db.payables,id),bal=Math.max(0,p.total-p.paid); paymentReceiptData=null;
 modal("Registrar pagamento",`<p>Saldo da parcela: <b>${money(bal)}</b></p>
 <div class="grid2">${formField("Valor","amount",bal,"number")}${formField("Data","pay_date",today(),"date")}</div>
 <div class="receipt-box">
   <label>Comprovante de pagamento</label>
   <div class="receipt-actions">
     <button type="button" class="btn ghost" onclick="document.getElementById('receiptCamera').click()">📷 Câmera</button>
     <button type="button" class="btn ghost" onclick="document.getElementById('receiptGallery').click()">🖼 Galeria</button>
   </div>
   <input id="receiptCamera" type="file" accept="image/*" capture="environment" style="display:none" onchange="handleReceiptFile(this)">
   <input id="receiptGallery" type="file" accept="image/*" style="display:none" onchange="handleReceiptFile(this)">
   <div id="receiptStatus" class="receipt-status">Nenhum comprovante anexado.</div>
   <img id="receiptPreview" class="receipt-preview" alt="Prévia do comprovante" style="display:none">
 </div>
 <p class="hint">Se o valor for maior que esta parcela, o excedente será abatido automaticamente da próxima parcela do mesmo lançamento.</p>`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">← Voltar</button><button class="btn primary" onclick="saveSupplierPayment(${id})">Confirmar</button></div>`)
}
function handleReceiptFile(input){
 const file=input?.files?.[0]; if(!file)return;
 if(!file.type.startsWith("image/"))return alert("Selecione uma imagem.");
 const reader=new FileReader();
 reader.onload=()=>{
   const img=new Image();
   img.onload=()=>{
     const max=1400, scale=Math.min(1,max/Math.max(img.width,img.height));
     const c=document.createElement("canvas"); c.width=Math.max(1,Math.round(img.width*scale)); c.height=Math.max(1,Math.round(img.height*scale));
     c.getContext("2d").drawImage(img,0,0,c.width,c.height);
     paymentReceiptData=c.toDataURL("image/jpeg",.78);
     const prev=$("#receiptPreview"); if(prev){prev.src=paymentReceiptData;prev.style.display="block"}
     const st=$("#receiptStatus"); if(st)st.textContent="Comprovante anexado com sucesso.";
   }; img.src=reader.result;
 }; reader.readAsDataURL(file);
}
function saveSupplierPayment(id){
 const p=find(db.payables,id); if(!p)return;
 const currentBalance=Math.max(0,Number(p.total||0)-Number(p.paid||0));
 const entered=Number($("#f_amount").value)||0;
 if(entered<=0)return alert("Informe um valor maior que zero.");
 const date=$("#f_pay_date").value||today();
 const groupId=p.installment_group;
 let remaining=entered, applied=0, count=0;
 const targets=db.payables.filter(x=>Number(x.supplier_id)===Number(p.supplier_id) && x.installment_group===groupId && Number(x.installment_number||0)>=Number(p.installment_number||0)).sort((a,b)=>Number(a.installment_number||0)-Number(b.installment_number||0));
 // Para contas antigas sem grupo de parcelas, aplica somente nesta conta.
 const list=targets.length?targets:[p];
 for(const item of list){
   const saldo=Math.max(0,Number(item.total||0)-Number(item.paid||0));
   if(saldo<=0)continue;
   const use=Math.min(remaining,saldo);
   if(use>0){
     item.paid=Number(item.paid||0)+use;
     db.supplierPayments.push({id:nextId(db.supplierPayments),payable_id:item.id,pay_date:date,amount:use,receipt:paymentReceiptData||null,source_payment_id:`${id}-${Date.now()}`,applied_to_installment:item.installment_number||1});
     remaining-=use; applied+=use; count++;
   }
   if(remaining<=0.005)break;
 }
 if(applied<=0){return alert("Não foi possível aplicar o pagamento.")}
 if(remaining>0.005){
   // Não cria saldo negativo. Informa o excedente que ultrapassou todas as parcelas.
   alert(`Pagamento aplicado até o limite das parcelas. Excedente não aplicado: ${money(remaining)}.`);
 }
 save();closeModal();render();toast(count>1?`Pagamento distribuído em ${count} parcelas`:`Pagamento registrado`);
}
function withdrawal(){modal("Saque",`<div class="grid2">${formField("Data","withdraw_date",today(),"date")}${formField("Valor","amount",0,"number")}</div>${formField("Descrição","description","")}`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">← Voltar</button><button class="btn primary" onclick="saveWithdrawal()">Registrar</button></div>`)}
function saveWithdrawal(){const v=Number($("#f_amount").value)||0;if(v<=0)return alert("Informe o valor.");db.withdrawals.push({id:nextId(db.withdrawals),withdraw_date:$("#f_withdraw_date").value,description:$("#f_description").value,amount:v});save();closeModal();render();toast("Saque registrado")}

function finished(){
 const q=(document.getElementById("finq")?.value||"").toLowerCase().trim();
 const rows=db.sales.filter(s=>s.total>0&&s.paid>=s.total).sort((a,b)=>b.id-a.id).filter(s=>{const c=find(db.clients,s.client_id);const text=`${s.sale_date} ${c?.name||""} ${s.payment||""} ${s.due_date||""}`.toLowerCase();return text.includes(q)}).map(s=>{const c=find(db.clients,s.client_id);return `<tr onclick="saleDetails(${s.id})"><td>${s.sale_date}</td><td>${esc(c?.name||"Não informado")}</td><td>${money(s.total)}</td><td>${money(s.paid)}</td><td>${esc(s.payment)}</td><td>${s.installments||1}</td><td>${s.due_date||""}</td><td><button class="icon-btn" onclick="event.stopPropagation();saleDetails(${s.id})">Detalhes</button> <button class="icon-btn" onclick="event.stopPropagation();deleteSale(${s.id})">Excluir</button></td></tr>`});
 return pageHead("Vendas Finalizadas")+`<div class="panel">${searchBox("finq","Buscar cliente, data ou pagamento...",q)}${table(["Data","Cliente","Total","Recebido","Pagamento","Parcelas","Vencimento","Ações"],rows.join(""))}</div>`;
}
function reports(){
 const salesTotal=db.sales.reduce((s,x)=>s+Number(x.total||0),0);
 const received=db.sales.reduce((s,x)=>s+Number(x.paid||0),0);
 const stock=db.products.reduce((s,p)=>s+Number(p.stock||0)*Number(p.sale||0),0);
 const rec=db.sales.reduce((s,x)=>s+Math.max(0,Number(x.total||0)-Number(x.paid||0)),0);
 const pay=db.payables.reduce((s,p)=>s+Math.max(0,Number(p.total||0)-Number(p.paid||0)),0);
 const resultado=stock+rec-pay;
 const withdraw=db.withdrawals.reduce((s,x)=>s+Number(x.amount||0),0);
 const todaySales=db.sales.filter(x=>x.sale_date===today()).reduce((s,x)=>s+Number(x.total||0),0);
 const openSales=db.sales.filter(x=>Number(x.total||0)>Number(x.paid||0)).length;
 return pageHead("Relatório da loja",`<button class="btn ghost" onclick="exportPdf()">Exportar PDF</button>`) + `
 <div class="report-hero"><h2>Visão geral da Lojinha da Tuca</h2><p>Resumo financeiro, vendas, estoque e compromissos da loja.</p></div>
 <div class="report-grid">
  <div class="report-card report-purple"><span>Vendas hoje</span><strong>${money(todaySales)}</strong></div>
  <div class="report-card report-blue"><span>Total vendido</span><strong>${money(salesTotal)}</strong></div>
  <div class="report-card report-orange"><span>A receber</span><strong>${money(rec)}</strong></div>
  <div class="report-card report-green"><span>Estoque (preço de venda)</span><strong>${money(stock)}</strong></div>
 </div>
 <div class="report-balance"><div class="label">BALANÇO DA LOJA</div><strong>${money(resultado)}</strong><div class="muted">Estoque + A receber − A pagar</div></div>
 <div class="report-section">${table(["INDICADOR","VALOR"],`
 <tr><td>Total recebido</td><td>${money(received)}</td></tr>
 <tr><td>Valor a pagar</td><td>${money(pay)}</td></tr>
 <tr><td>Saques registrados</td><td>${money(withdraw)}</td></tr>
 <tr><td>Vendas em aberto</td><td>${openSales}</td></tr>
 <tr><td>Clientes cadastrados</td><td>${db.clients.length}</td></tr>
 <tr><td>Produtos cadastrados</td><td>${db.products.length}</td></tr>
 <tr><td>Fornecedores cadastrados</td><td>${db.suppliers.length}</td></tr>`)} </div>`;
}

function exportPdf(){
 const previous=document.title;
 document.title="Relatório - Lojinha da Tuca";
 document.body.classList.add("print-report");
 setTimeout(()=>{window.print();setTimeout(()=>{document.body.classList.remove("print-report");document.title=previous},500)},50);
}

function exportCsv(){
 const stock=db.products.reduce((s,p)=>s+Number(p.stock||0)*Number(p.sale||0),0);
 const rec=db.sales.reduce((s,x)=>s+Math.max(0,Number(x.total||0)-Number(x.paid||0)),0);
 const pay=db.payables.reduce((s,x)=>s+Math.max(0,Number(x.total||0)-Number(x.paid||0)),0);
 const rows=[["Indicador","Valor"],["Total vendido",db.sales.reduce((s,x)=>s+Number(x.total||0),0)],["Total recebido",db.sales.reduce((s,x)=>s+Number(x.paid||0),0)],["Estoque a preço de venda",stock],["A receber",rec],["A pagar",pay],["Estoque + A receber - A pagar",stock+rec-pay]];
 const csv=rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(";")).join("\n");download("relatorio_tuca.csv",new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}))}
function download(name,blob){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$("#backupBtn").onclick=()=>download("backup_lojinhas_da_tuca.json",new Blob([JSON.stringify(db,null,2)],{type:"application/json"}));
$("#restoreFile").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.products||!x.sales)throw 0;db=x;save();render();toast("Backup importado")}catch(_){alert("Arquivo de backup inválido.")}};r.readAsText(f);e.target.value=""};
$("#brand").ondblclick=()=>{const n=prompt("Nome do cabeçalho:",db.title);if(n&&n.trim()){db.title=n.trim();save();render()}};
window.newProduct=newProduct;window.editProduct=editProduct;window.deleteProduct=deleteProduct;window.restock=restock;window.newClient=newClient;window.editClient=editClient;window.deleteClient=deleteClient;window.clientDetails=clientDetails;window.newSale=newSale;window.saleDetails=saleDetails;window.payment=payment;window.deleteSale=deleteSale;window.whatsapp=whatsapp;window.newSupplier=newSupplier;window.editSupplier=editSupplier;window.deleteSupplier=deleteSupplier;window.supplierDetails=supplierDetails;window.newPayable=newPayable;window.editPayable=editPayable;window.payableDetails=payableDetails;window.supplierPayment=supplierPayment;window.withdrawal=withdrawal;window.go=go;window.closeModal=closeModal;window.saveProduct=saveProduct;window.saveClient=saveClient;window.saveSale=saveSale;window.savePayment=savePayment;window.saveSupplier=saveSupplier;window.savePayable=savePayable;window.saveSupplierPayment=saveSupplierPayment;window.saveWithdrawal=saveWithdrawal;window.exportCsv=exportCsv;window.exportPdf=exportPdf;window.handleReceiptFile=handleReceiptFile;
render();


// V6 mobile navigation
$('#mobileMenuBtn')?.addEventListener('click',()=>$('#mobileDrawer')?.classList.remove('hidden'));
$('#closeMobileMenu')?.addEventListener('click',closeMobileMenu);
$('#mobileDrawer')?.addEventListener('click',e=>{
  const b=e.target.closest('button[data-page]');
  if(b){page=b.dataset.page;closeMobileMenu();render();}
});
$('#mobileBackupBtn')?.addEventListener('click',()=>$('#backupBtn')?.click());
$('#mobileRestoreFile')?.addEventListener('change',e=>{
  const src=e.target.files?.[0]; if(!src)return;
  const r=new FileReader(); r.onload=()=>{try{db=JSON.parse(r.result);save();render();toast('Backup importado');}catch(err){alert('Backup inválido.');}}; r.readAsText(src); e.target.value='';
});
