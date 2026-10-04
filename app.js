const KEY="lojinha_tuca_web_v1";
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
  $("#modalCard").innerHTML=`<div class="modal-head"><h2>${title}</h2><button class="icon-btn" onclick="closeModal()">✕</button></div>${body}${buttons}`;
  $("#modal").classList.remove("hidden");
}
function closeModal(){$("#modal").classList.add("hidden")}
$("#modal").addEventListener("click",e=>e.stopPropagation());
document.addEventListener("keydown",e=>{if(e.key==="Escape")e.preventDefault()});
function formField(label,name,value="",type="text"){return `<div class="field"><label>${label}</label><input id="f_${name}" type="${type}" value="${esc(value)}"></div>`}
function selectField(label,name,opts,value=""){return `<div class="field"><label>${label}</label><select id="f_${name}">${opts.map(o=>`<option ${String(o[0])===String(value)?"selected":""} value="${esc(o[0])}">${esc(o[1])}</option>`).join("")}</select></div>`}
function pageHead(title,actions=""){return `<div class="page-head"><div class="page-title-wrap"><button class="mobile-back-btn" onclick="go('dashboard')" aria-label="Voltar">←</button><h1>${title}</h1></div><div class="actions">${actions}</div></div>`}
function table(headers,rows,empty="Nenhum registro"){return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}" class="empty">${empty}</td></tr>`}</tbody></table></div>`}

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
 $("#appTitle").textContent=db.title||"LOJINHA DA TUCA";
 document.querySelectorAll("#tabs button").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 const fn={dashboard:dashboard,products:products,clients:clients,sales:sales,receivables:receivables,suppliers:suppliers,payables:payables,finished:finished,reports:reports}[page];
 $("#content").innerHTML=fn();
}
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("button[data-page]");if(b){page=b.dataset.page;render()}});

function dashboard(){
 const stock=db.products.reduce((s,p)=>s+Number(p.stock||0),0);
 const stockValue=db.products.reduce((s,p)=>s+Number(p.stock||0)*Number(p.sale||0),0);
 const receivable=db.sales.reduce((s,x)=>s+Math.max(0,Number(x.total)-Number(x.paid||0)),0);
 const payable=db.payables.reduce((s,x)=>s+Math.max(0,Number(x.total)-Number(x.paid||0)),0);
 const overdue=db.sales.filter(x=>x.due_date&&x.due_date<today()&&Number(x.total)>Number(x.paid||0)).reduce((s,x)=>s+Number(x.total)-Number(x.paid||0),0);
 const todaySales=db.sales.filter(x=>x.sale_date===today()).reduce((s,x)=>s+Number(x.total||0),0);
 const monthKey=today().slice(0,7);
 const monthSales=db.sales.filter(x=>(x.sale_date||'').slice(0,7)===monthKey).reduce((s,x)=>s+Number(x.total||0),0);
 return `<section class="mobile-home-intro"><div class="intro-title">Olá, Galassi!</div><div class="intro-sub">Veja um resumo da sua loja hoje.</div><div class="intro-date">🛍️ 📅 ${new Date().toLocaleDateString('pt-BR')}</div></section>`+
 `<div class="page-head desktop-head"><h1>Painel da loja</h1><div class="actions"><button class="btn primary" onclick="newSale()">+ Nova venda</button></div></div>`+
 `<div class="mobile-page-head"><h1>Painel da loja</h1><button class="btn primary" onclick="newSale()">+ Nova venda</button></div>`+
 `<div class="cards dashboard-cards">
 <div class="card metric-sale dashboard-link" onclick="go('sales')" role="button" tabindex="0"><div class="metric-icon">🛒</div><div class="label">Vendas hoje</div><div class="value">${money(todaySales)}</div><div class="metric-note">${db.sales.filter(x=>x.sale_date===today()).length} venda(s)</div></div>
 <div class="card metric-clients dashboard-link" onclick="go('clients')" role="button" tabindex="0"><div class="metric-icon">👥</div><div class="label">Clientes</div><div class="value">${db.clients.length}</div><div class="metric-note">cadastrados</div></div>
 <div class="card metric-products dashboard-link" onclick="go('products')" role="button" tabindex="0"><div class="metric-icon">📦</div><div class="label">Produtos</div><div class="value">${stock}</div><div class="metric-note">em estoque</div></div>
 <div class="card metric-receive dashboard-link" onclick="go('receivables')" role="button" tabindex="0"><div class="metric-icon">💵</div><div class="label">A receber</div><div class="value">${money(receivable)}</div><div class="metric-note">em aberto</div></div>
 <div class="card metric-pay dashboard-link" onclick="go('payables')" role="button" tabindex="0"><div class="metric-icon">🚚</div><div class="label">A pagar</div><div class="value">${money(payable)}</div><div class="metric-note">contas em aberto</div></div>
 <div class="card metric-month dashboard-link" onclick="go('sales')" role="button" tabindex="0"><div class="metric-icon">📊</div><div class="label">Vendas mês</div><div class="value">${money(monthSales)}</div><div class="metric-note">${db.sales.filter(x=>(x.sale_date||'').slice(0,7)===monthKey).length} venda(s)</div></div>
 </div>
 <div class="mobile-balance"><span>Valor do estoque (venda)</span><strong>${money(stockValue)}</strong><span class="desktop-only"> • Em atraso: ${money(overdue)}</span></div>
 <div class="panel shortcuts-panel"><h3>Atalhos</h3><div class="actions shortcuts-actions">
 <button class="btn ghost" onclick="newProduct()">Cadastrar produto</button>
 <button class="btn ghost" onclick="newClient()">Cadastrar cliente</button>
 <button class="btn ghost" onclick="newSupplier()">Cadastrar fornecedor</button>
 <button class="btn ghost" onclick="newPayable()">Nova conta a pagar</button>
 <button class="btn ghost" onclick="go('reports')">Ver relatório</button>
 </div></div>
 <div class="panel recent-panel"><h3>Últimas vendas</h3>${recentSales()}</div>`;
}
function go(p){page=p;render()}
function recentSales(){
 const rows=[...db.sales].sort((a,b)=>Number(b.id)-Number(a.id)).slice(0,8).map(s=>{
 const c=find(db.clients,s.client_id); return `<tr><td>${esc(s.sale_date)}</td><td>${esc(c?.name||"Não informado")}</td><td class="money">${money(s.total)}</td><td>${money(s.paid)}</td><td>${money(Math.max(0,s.total-s.paid))}</td></tr>`});
 return table(["Data","Cliente","Total","Pago","Saldo"],rows.join(""))
}

function products(){
 let q=($("#pq")?.value||"").toLowerCase();
 const rows=db.products.filter(p=>(`${p.code} ${p.kind} ${p.description} ${p.size}`).toLowerCase().includes(q)).map(p=>`<tr>
 <td>${esc(p.code)}</td><td>${esc(p.kind)}</td><td>${esc(p.description)}</td><td>${esc(p.size)}</td><td>${money(p.cost)}</td><td>${Number(p.margin||0).toFixed(2)}%</td><td class="money">${money(p.sale)}</td><td>${p.stock}</td>
 <td class="nowrap"><button class="icon-btn" onclick="editProduct(${p.id})">Editar</button> <button class="icon-btn" onclick="restock(${p.id})">Repor</button> <button class="icon-btn" onclick="deleteProduct(${p.id})">Excluir</button></td></tr>`);
 return pageHead("Produtos",`<button class="btn primary" onclick="newProduct()">+ Novo produto</button>`) +
 `<div class="panel"><div class="toolbar"><input id="pq" class="search" placeholder="Pesquisar produto..." value="${esc(q)}" oninput="render()"></div>${table(["Código","Tipo","Descrição","Tamanho","Custo","Margem","Venda","Estoque","Ações"],rows.join(""))}</div>`;
}
function productForm(p={}){
 const margins=[["30","30%"],["50","50%"],["80","80%"],["100","100%"],["Outra","Outra"]];
 const savedMargin=String(p.margin??"");
 const marginKnown=margins.some(o=>o[0]===savedMargin);
 const marginField=selectField("Margem %","margin",margins,marginKnown?savedMargin:"50");
 const body=`<div class="grid2">${formField("Código","code",p.code)}${selectField("Tipo","kind",[["Blusa","Blusa"],["Camiseta","Camiseta"],["Calça Jeans","Calça Jeans"],["Shorts","Shorts"],["Vestido","Vestido"],["Saia","Saia"],["Conjunto","Conjunto"],["Outro","Outro"]],p.kind)}
 ${formField("Descrição","description",p.description)}${formField("Tamanho","size",p.size)}
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
function newProduct(){modal("Novo produto",productForm(),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Voltar</button><button class="btn primary" onclick="saveProduct()">Salvar</button></div>`);setupProductCalc()}
function editProduct(id){const p=find(db.products,id);modal("Editar produto",productForm(p),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Voltar</button><button class="btn primary" onclick="saveProduct(${id})">Salvar</button></div>`);setupProductCalc()}
function saveProduct(id){
 const v=n=>$("#f_"+n).value.trim(), p=find(db.products,id)||{id:nextId(db.products)};
 const marginValue=v("margin")==="Outra"?(Number($("#f_customMargin")?.value)||0):Number(v("margin"))||0;
 const costValue=Number(v("cost").replace(",","."))||0;
 const saleValue=Number(v("sale").replace(",","."))||0;
 Object.assign(p,{code:v("code"),kind:v("kind"),description:v("description"),size:v("size"),cost:costValue,margin:marginValue,sale:saleValue,stock:Math.max(0,parseInt(v("stock"))||0),observation:$("#f_observation").value});
 if(!id)db.products.push(p);save();closeModal();render();toast("Produto salvo")}
function deleteProduct(id){if(db.saleItems.some(x=>Number(x.product_id)===Number(id)))return alert("Este produto possui histórico de vendas e não pode ser excluído.");if(confirm("Excluir este produto?")){db.products=db.products.filter(x=>x.id!==id);save();render()}}
function restock(id){const n=prompt("Quantidade a adicionar:","1");const q=parseInt(n);if(q>0){const p=find(db.products,id);p.stock+=q;p.exhausted_at=null;save();render();toast("Estoque atualizado")}}

function clients(){
 let q=($("#cq")?.value||"").toLowerCase();
 const rows=db.clients.filter(c=>(`${c.name} ${c.cpf} ${c.phone} ${c.address}`).toLowerCase().includes(q)).map(c=>`<tr ondblclick="clientDetails(${c.id})"><td>${esc(c.name)}</td><td>${esc(c.cpf||"")}</td><td>${esc(c.phone||"")}</td><td>${esc(c.address||"")}</td><td><button class="icon-btn" onclick="event.stopPropagation();editClient(${c.id})">Editar</button> <button class="icon-btn" onclick="deleteClient(${c.id})">Excluir</button></td></tr>`);
 return pageHead("Clientes",`<button class="btn primary" onclick="newClient()">+ Novo cliente</button>`) + `<div class="panel"><div class="toolbar"><input id="cq" class="search" placeholder="Pesquisar cliente..." value="${esc(q)}" oninput="render()"></div>${table(["Nome","CPF","Telefone","Endereço","Ações"],rows.join(""))}</div>`;
}
function clientForm(c={}){
 return `<div class="grid2">${formField("Nome completo","name",c.name)}${formField("CPF","cpf",c.cpf)}${formField("Telefone","phone",c.phone)}${formField("Endereço","address",c.address)}</div><div class="field" style="margin-top:10px"><label>Observações</label><textarea id="f_notes">${esc(c.notes||"")}</textarea></div>`;
}
function newClient(prefill=""){modal("Novo cliente",clientForm({name:prefill}),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Voltar</button><button class="btn primary" onclick="saveClient()">Salvar</button></div>`)}
function clientDetails(id){
 const c=find(db.clients,id); if(!c)return; const sales=db.sales.filter(s=>Number(s.client_id)===Number(id));
 const total=sales.reduce((a,s)=>a+Number(s.total||0),0), paid=sales.reduce((a,s)=>a+Number(s.paid||0),0);
 modal("Detalhes do cliente",`<div class="detail-grid"><p><b>Nome:</b> ${esc(c.name||"")}</p><p><b>CPF:</b> ${esc(c.cpf||"")}</p><p><b>Telefone:</b> ${esc(c.phone||"")}</p><p><b>Endereço:</b> ${esc(c.address||"")}</p><p><b>Total de vendas:</b> ${sales.length}</p><p><b>Valor vendido:</b> ${money(total)}</p><p><b>Recebido:</b> ${money(paid)}</p><p><b>Em aberto:</b> ${money(Math.max(0,total-paid))}</p><p><b>Observações:</b> ${esc(c.notes||"")}</p></div>`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Fechar</button><button class="btn primary" onclick="closeModal();editClient(${id})">Editar</button></div>`)
}
function editClient(id){const c=find(db.clients,id);modal("Editar cliente",clientForm(c),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Voltar</button><button class="btn primary" onclick="saveClient(${id})">Salvar</button></div>`)}
function saveClient(id){
 const v=n=>$("#f_"+n).value.trim(),c=find(db.clients,id)||{id:nextId(db.clients)};
 Object.assign(c,{name:v("name"),cpf:v("cpf"),phone:v("phone"),address:v("address"),notes:$("#f_notes").value});
 if(!c.name)return alert("Informe o nome.");if(!id)db.clients.push(c);save();closeModal();render();toast("Cliente salvo")}
function deleteClient(id){if(db.sales.some(s=>Number(s.client_id)===Number(id)))return alert("Este cliente possui histórico de vendas e não pode ser excluído.");if(confirm("Excluir este cliente?")){db.clients=db.clients.filter(x=>x.id!==id);save();render()}}

function sales(){
 const rows=[...db.sales].sort((a,b)=>b.id-a.id).map(s=>{const c=find(db.clients,s.client_id),bal=Math.max(0,s.total-s.paid);return `<tr ondblclick="saleDetails(${s.id})"><td>${s.sale_date}</td><td>${esc(c?.name||"Não informado")}</td><td>${money(s.total)}</td><td>${esc(s.payment||"")}</td><td>${s.installments||1}</td><td>${s.due_date||""}</td><td>${money(s.paid)}</td><td class="money">${money(bal)}</td><td class="nowrap"><button class="icon-btn" onclick="event.stopPropagation();payment(${s.id})">Pagamento</button> <button class="icon-btn" onclick="event.stopPropagation();deleteSale(${s.id})">Excluir</button></td></tr>`});
 return pageHead("Vendas",`<button class="btn primary" onclick="newSale()">+ Nova venda</button>`) + `<div class="panel">${table(["Data","Cliente","Total","Pagamento","Parcelas","Vencimento","Pago","Saldo","Ações"],rows.join(""))}</div>`;
}
function saleDetails(id){
 const s=find(db.sales,id); if(!s)return; const c=find(db.clients,s.client_id); const items=db.saleItems.filter(i=>Number(i.sale_id)===Number(id));
 const lista=items.map(i=>{const p=find(db.products,i.product_id);return `<tr><td>${esc(p?.description||"Produto")}</td><td>${esc(p?.size||"")}</td><td>${i.qty}</td><td>${money(i.price)}</td><td>${money(Number(i.qty)*Number(i.price))}</td></tr>`}).join("");
 modal("Detalhes da venda",`<p><b>Data:</b> ${s.sale_date} &nbsp; <b>Cliente:</b> ${esc(c?.name||"Não informado")}</p><p><b>Pagamento:</b> ${esc(s.payment||"")} &nbsp; <b>Parcelas:</b> ${s.installments||1} &nbsp; <b>Vencimento:</b> ${s.due_date||""}</p><p><b>Total:</b> ${money(s.total)} &nbsp; <b>Recebido:</b> ${money(s.paid)} &nbsp; <b>Saldo:</b> ${money(Math.max(0,s.total-s.paid))}</p><div class="panel"><table><thead><tr><th>Produto</th><th>Tamanho</th><th>Qtd.</th><th>Preço</th><th>Subtotal</th></tr></thead><tbody>${lista||'<tr><td colspan="5">Nenhum item</td></tr>'}</tbody></table></div>`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Fechar</button></div>`)
}
function newSale(){
 if(!db.products.some(p=>p.stock>0))return alert("Não há produtos disponíveis para venda.");
 const clients=[["","Selecione..."],...db.clients.map(c=>[c.id,c.name])];
 const prods=[...db.products.filter(p=>p.stock>0).map(p=>[p.id,`${p.description} / ${p.size||"-"} — ${money(p.sale)} — estoque ${p.stock}`])];
 modal("Nova venda",`<div class="grid2">${selectField("Cliente","client_id",clients)}${selectField("Produto","product_id",prods)}${formField("Quantidade","qty",1,"number")}${selectField("Pagamento","payment",[["À vista","À vista"],["Crédito","Crédito"],["PIX","PIX"],["Cartão","Cartão"],["Outro","Outro"]])}${selectField("Parcelas","installments",[["1","1x"],["2","2x"],["3","3x"],["4","4x"],["5","5x"],["6","6x"]],1)}${formField("Vencimento","due_date",today(),"date")}</div><div class="panel" style="margin-top:12px"><b>Total: <span id="saleTotal">${money(0)}</span></b></div>`, `<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Voltar</button><button class="btn primary" onclick="saveSale()">Confirmar venda</button></div>`);
 $("#f_product_id").addEventListener("change",calcSale);$("#f_qty").addEventListener("input",calcSale);calcSale()
}
function calcSale(){const p=find(db.products,$("#f_product_id").value);$("#saleTotal").textContent=money((p?.sale||0)*(parseInt($("#f_qty").value)||0))}
function saveSale(){
 const p=find(db.products,$("#f_product_id").value),q=parseInt($("#f_qty").value)||0,cid=$("#f_client_id").value;
 if(!p||q<=0)return alert("Selecione produto e quantidade.");
 if(q>p.stock)return alert(`Estoque disponível: ${p.stock}.`);
 if(!cid)return alert("Para registrar a venda, selecione um cliente cadastrado.");
 const total=q*Number(p.sale), pay=$("#f_payment").value, paid=pay==="À vista"?total:0;
 const s={id:nextId(db.sales),client_id:Number(cid),sale_date:today(),total,paid,payment:pay,installments:parseInt($("#f_installments").value)||1,due_date:$("#f_due_date").value};
 db.sales.push(s);db.saleItems.push({id:nextId(db.saleItems),sale_id:s.id,product_id:p.id,qty:q,price:p.sale});p.stock-=q;if(p.stock===0)p.exhausted_at=today();save();closeModal();render();toast("Venda registrada")}
function deleteSale(id){if(!confirm("Excluir a venda? O item voltará ao estoque e os pagamentos serão removidos."))return;db.saleItems.filter(x=>x.sale_id===id).forEach(it=>{const p=find(db.products,it.product_id);if(p)p.stock+=Number(it.qty)});db.saleItems=db.saleItems.filter(x=>x.sale_id!==id);db.payments=db.payments.filter(x=>x.sale_id!==id);db.sales=db.sales.filter(x=>x.id!==id);save();render();toast("Venda excluída")}
function payment(id){
 const s=find(db.sales,id),bal=Math.max(0,s.total-s.paid);if(bal<=.005)return alert("Venda já quitada.");
 modal("Registrar pagamento",`<p>Saldo atual: <b>${money(bal)}</b></p><div class="grid2">${formField("Valor","amount",bal,"number")}${formField("Data","pay_date",today(),"date")}</div>`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Voltar</button><button class="btn primary" onclick="savePayment(${id})">Confirmar pagamento</button></div>`)
}
function savePayment(id){const s=find(db.sales,id),bal=Math.max(0,s.total-s.paid),v=Number($("#f_amount").value)||0;if(v<=0||v>bal)return alert("Valor inválido.");s.paid+=v;db.payments.push({id:nextId(db.payments),sale_id:id,pay_date:$("#f_pay_date").value,amount:v});save();closeModal();render();toast("Pagamento registrado")}

function receivables(){
 const open=db.sales.filter(s=>s.total>s.paid);
 const rows=open.sort((a,b)=>(a.due_date||"").localeCompare(b.due_date||"")).map(s=>{const c=find(db.clients,s.client_id),bal=s.total-s.paid,late=s.due_date&&s.due_date<today();return `<tr><td>${esc(c?.name||"Não informado")}</td><td>${s.sale_date}</td><td>${s.due_date||""}</td><td>${money(s.total)}</td><td>${money(s.paid)}</td><td class="money">${money(bal)}</td><td><span class="status ${late?"bad":"open"}">${late?"ATRASADO":"EM ABERTO"}</span></td><td><button class="icon-btn" onclick="event.stopPropagation();payment(${s.id})">Pagamento</button>${c?.phone?` <button class="icon-btn" onclick="whatsapp(${s.id})">WhatsApp</button>`:""}</td></tr>`});
 return pageHead("Contas a Receber") + `<div class="panel">${table(["Cliente","Venda","Vencimento","Total","Pago","Saldo","Status","Ações"],rows.join(""))}</div>`;
}
function whatsapp(id){const s=find(db.sales,id),c=find(db.clients,s.client_id),v=money(s.total-s.paid);let phone=(c.phone||"").replace(/\D/g,"");if(phone.length===10||phone.length===11)phone="55"+phone;if(phone.length<12)return alert("Telefone inválido.");const msg=`Oi ${c.name.split(" ")[0]}, tudo bem? Tem uma parcelinha sua de ${v} em aberto. Consegue me mandar?`;window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,"_blank")}

function suppliers(){
 const rows=db.suppliers.map(s=>`<tr ondblclick="supplierDetails(${s.id})"><td>${esc(s.name)}</td><td>${esc(s.phone)}</td><td>${esc(s.document)}</td><td>${esc(s.address)}</td><td><button class="icon-btn" onclick="event.stopPropagation();editSupplier(${s.id})">Editar</button> <button class="icon-btn" onclick="deleteSupplier(${s.id})">Excluir</button></td></tr>`);
 return pageHead("Fornecedores",`<button class="btn primary" onclick="newSupplier()">+ Novo fornecedor</button>`) + `<div class="panel">${table(["Fornecedor","Telefone","CPF/CNPJ","Endereço","Ações"],rows.join(""))}</div>`;
}
function supplierForm(s={}){return `<div class="grid2">${formField("Nome","name",s.name)}${formField("Telefone","phone",s.phone)}${formField("CPF/CNPJ","document",s.document)}${formField("Endereço","address",s.address)}</div><div class="field" style="margin-top:10px"><label>Observações</label><textarea id="f_notes">${esc(s.notes||"")}</textarea></div>`}
function supplierDetails(id){
 const s=find(db.suppliers,id); if(!s)return; const buys=db.payables.filter(p=>Number(p.supplier_id)===Number(id)); const total=buys.reduce((a,p)=>a+Number(p.total||0),0),paid=buys.reduce((a,p)=>a+Number(p.paid||0),0);
 modal("Detalhes do fornecedor",`<div class="detail-grid"><p><b>Fornecedor:</b> ${esc(s.name||"")}</p><p><b>Telefone:</b> ${esc(s.phone||"")}</p><p><b>CPF/CNPJ:</b> ${esc(s.document||"")}</p><p><b>Endereço:</b> ${esc(s.address||"")}</p><p><b>Compras/contas:</b> ${buys.length}</p><p><b>Total:</b> ${money(total)}</p><p><b>Pago:</b> ${money(paid)}</p><p><b>Em aberto:</b> ${money(Math.max(0,total-paid))}</p><p><b>Observações:</b> ${esc(s.notes||"")}</p></div>`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Fechar</button><button class="btn primary" onclick="closeModal();editSupplier(${id})">Editar</button></div>`)
}
function newSupplier(){modal("Novo fornecedor",supplierForm(),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Voltar</button><button class="btn primary" onclick="saveSupplier()">Salvar</button></div>`)}
function editSupplier(id){modal("Editar fornecedor",supplierForm(find(db.suppliers,id)),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Voltar</button><button class="btn primary" onclick="saveSupplier(${id})">Salvar</button></div>`)}
function saveSupplier(id){const v=n=>$("#f_"+n).value.trim(),s=find(db.suppliers,id)||{id:nextId(db.suppliers)};Object.assign(s,{name:v("name"),phone:v("phone"),document:v("document"),address:v("address"),notes:$("#f_notes").value});if(!s.name)return alert("Informe o nome.");if(!id)db.suppliers.push(s);save();closeModal();render();toast("Fornecedor salvo")}
function deleteSupplier(id){if(db.payables.some(p=>p.supplier_id===id))return alert("Este fornecedor possui contas registradas.");if(confirm("Excluir fornecedor?")){db.suppliers=db.suppliers.filter(x=>x.id!==id);save();render()}}

function payables(){
 const rows=db.payables.sort((a,b)=>(a.due_date||"").localeCompare(b.due_date||"")).map(p=>{const s=find(db.suppliers,p.supplier_id),bal=p.total-p.paid,late=p.due_date&&p.due_date<today();return `<tr ondblclick="payableDetails(${p.id})"><td>${esc(s?.name||"Não informado")}</td><td>${esc(p.description)}</td><td>${p.due_date||""}</td><td>${p.installments>1?`${p.installment_number}/${p.installments}`:"1/1"}</td><td>${money(p.total)}</td><td>${money(p.paid)}</td><td class="money">${money(bal)}</td><td><span class="status ${bal<=0?"ok":late?"bad":"open"}">${bal<=0?"PAGO":late?"ATRASADO":"EM ABERTO"}</span></td><td>${bal>0?`<button class="icon-btn" onclick="supplierPayment(${p.id})">Pagamento</button>`:""} <button class="icon-btn" onclick="editPayable(${p.id})">Editar</button></td></tr>`});
 return pageHead("Contas a Pagar",`<button class="btn primary" onclick="newPayable()">+ Nova conta</button><button class="btn warn" onclick="withdrawal()">Saque</button>`) + `<div class="panel">${table(["Fornecedor","Descrição","Vencimento","Parcela","Total","Pago","Saldo","Status","Ações"],rows.join(""))}</div>`;
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
function newPayable(){if(!db.suppliers.length)return alert("Cadastre um fornecedor primeiro.");modal("Nova compra / conta a pagar",payableForm(),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Voltar</button><button class="btn primary" onclick="savePayable()">Salvar compra</button></div>`)}
function editPayable(id){modal("Editar conta",payableForm(find(db.payables,id),true),`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Voltar</button><button class="btn primary" onclick="savePayable(${id})">Salvar</button></div>`)}
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
function supplierPayment(id){const p=find(db.payables,id),bal=p.total-p.paid;modal("Registrar pagamento",`<p>Saldo: <b>${money(bal)}</b></p><div class="grid2">${formField("Valor","amount",bal,"number")}${formField("Data","pay_date",today(),"date")}</div>`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Voltar</button><button class="btn primary" onclick="saveSupplierPayment(${id})">Confirmar</button></div>`)}
function saveSupplierPayment(id){const p=find(db.payables,id),bal=p.total-p.paid,v=Number($("#f_amount").value)||0;if(v<=0||v>bal)return alert("Valor inválido.");p.paid+=v;db.supplierPayments.push({id:nextId(db.supplierPayments),payable_id:id,pay_date:$("#f_pay_date").value,amount:v});save();closeModal();render();toast("Pagamento registrado")}
function withdrawal(){modal("Saque",`<div class="grid2">${formField("Data","withdraw_date",today(),"date")}${formField("Valor","amount",0,"number")}</div>${formField("Descrição","description","")}`,`<div class="modal-actions"><button class="btn ghost" onclick="closeModal()">Voltar</button><button class="btn primary" onclick="saveWithdrawal()">Registrar</button></div>`)}
function saveWithdrawal(){const v=Number($("#f_amount").value)||0;if(v<=0)return alert("Informe o valor.");db.withdrawals.push({id:nextId(db.withdrawals),withdraw_date:$("#f_withdraw_date").value,description:$("#f_description").value,amount:v});save();closeModal();render();toast("Saque registrado")}

function finished(){
 const rows=db.sales.filter(s=>s.total>0&&s.paid>=s.total).sort((a,b)=>b.id-a.id).map(s=>{const c=find(db.clients,s.client_id);return `<tr ondblclick="saleDetails(${s.id})"><td>${s.sale_date}</td><td>${esc(c?.name||"Não informado")}</td><td>${money(s.total)}</td><td>${money(s.paid)}</td><td>${esc(s.payment)}</td><td>${s.installments||1}</td><td>${s.due_date||""}</td><td><button class="icon-btn" onclick="event.stopPropagation();deleteSale(${s.id})">Excluir</button></td></tr>`});
 return pageHead("Vendas Finalizadas")+`<div class="panel">${table(["Data","Cliente","Total","Recebido","Pagamento","Parcelas","Vencimento","Ações"],rows.join(""))}</div>`;
}
function reports(){
 const salesTotal=db.sales.reduce((s,x)=>s+Number(x.total||0),0);
 const received=db.sales.reduce((s,x)=>s+Number(x.paid||0),0);
 const stock=db.products.reduce((s,p)=>s+Number(p.stock||0)*Number(p.sale||0),0);
 const rec=db.sales.reduce((s,x)=>s+Math.max(0,Number(x.total||0)-Number(x.paid||0)),0);
 const pay=db.payables.reduce((s,p)=>s+Math.max(0,Number(p.total||0)-Number(p.paid||0)),0);
 const resultado=stock+rec-pay;
 const withdraw=db.withdrawals.reduce((s,x)=>s+Number(x.amount||0),0);
 return pageHead("Relatórios",`<button class="btn ghost" onclick="exportCsv()">Exportar CSV</button>`) + `<div class="panel">${table(["INDICADOR","VALOR"],`
 <tr><td>Total vendido</td><td>${money(salesTotal)}</td></tr>
 <tr><td>Total recebido</td><td>${money(received)}</td></tr>
 <tr><td>Valor do estoque (preço de venda)</td><td>${money(stock)}</td></tr>
 <tr><td>Valor a receber</td><td>${money(rec)}</td></tr>
 <tr><td>Valor a pagar</td><td>${money(pay)}</td></tr>
 <tr class="report-total"><td><b>ESTOQUE + A RECEBER - A PAGAR</b></td><td><b>${money(resultado)}</b></td></tr>
 <tr><td>Saques registrados</td><td>${money(withdraw)}</td></tr>
 <tr><td>Clientes cadastrados</td><td>${db.clients.length}</td></tr>
 <tr><td>Produtos cadastrados</td><td>${db.products.length}</td></tr>
 <tr><td>Fornecedores cadastrados</td><td>${db.suppliers.length}</td></tr>`)} </div>`;
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
$("#resetBtn").onclick=()=>{if(confirm("ATENÇÃO: isso apagará os dados deste navegador. Faça um backup antes. Continuar?")){localStorage.removeItem(KEY);db=load();render();toast("Dados limpos")}};
$("#brand").ondblclick=()=>{const n=prompt("Nome do cabeçalho:",db.title);if(n&&n.trim()){db.title=n.trim();save();render()}};
window.newProduct=newProduct;window.editProduct=editProduct;window.deleteProduct=deleteProduct;window.restock=restock;window.newClient=newClient;window.editClient=editClient;window.deleteClient=deleteClient;window.newSale=newSale;window.payment=payment;window.deleteSale=deleteSale;window.whatsapp=whatsapp;window.newSupplier=newSupplier;window.editSupplier=editSupplier;window.deleteSupplier=deleteSupplier;window.newPayable=newPayable;window.editPayable=editPayable;window.supplierPayment=supplierPayment;window.withdrawal=withdrawal;window.go=go;window.closeModal=closeModal;window.saveProduct=saveProduct;window.saveClient=saveClient;window.saveSale=saveSale;window.savePayment=savePayment;window.saveSupplier=saveSupplier;window.savePayable=savePayable;window.saveSupplierPayment=saveSupplierPayment;window.saveWithdrawal=saveWithdrawal;window.exportCsv=exportCsv;
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
$('#mobileResetBtn')?.addEventListener('click',()=>$('#resetBtn')?.click());
